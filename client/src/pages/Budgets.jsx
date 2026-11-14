import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, TriangleAlert, CircleCheck, Tags } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import useCategories from '../hooks/useCategories';
import BudgetProgress from '../components/BudgetProgress';
import MonthPicker from '../components/MonthPicker';
import CategoryModal from '../components/CategoryModal';
import CategoryIcon from '../components/CategoryIcon';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner, { PageLoader } from '../components/Spinner';
import { currentMonthValue, formatCurrency, monthLabel, parseMonthValue } from '../utils/format';

export default function Budgets() {
  const [month, setMonth] = useState(currentMonthValue());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);

  const { categories, loading: catsLoading, reload: reloadCategories } = useCategories();
  const [catType, setCatType] = useState('expense');
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load the budget + spending for the selected month (all calculated by the backend).
  useEffect(() => {
    let ignore = false;
    const { year, month: m } = parseMonthValue(month);
    setLoading(true);
    api
      .get('/dashboard/summary', { params: { month: m, year } })
      .then((res) => {
        if (ignore) return;
        setSummary(res.data);
        setAmount(res.data.budget ? String(res.data.budget.amount) : '');
        setAmountError('');
      })
      .catch((err) => !ignore && toast.error(getErrorMessage(err, 'Could not load the budget')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const saveBudget = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) {
      setAmountError('Enter a budget greater than 0');
      return;
    }
    setAmountError('');
    setSaving(true);
    try {
      if (summary.budget) {
        await api.put(`/budgets/${summary.budget._id}`, { amount: Number(amount) });
        toast.success('Budget updated');
      } else {
        const { year, month: m } = parseMonthValue(month);
        await api.post('/budgets', { amount: Number(amount), month: m, year });
        toast.success('Budget saved');
      }
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${catToDelete._id}`);
      toast.success('Category deleted');
      setCatToDelete(null);
      reloadCategories();
    } catch (err) {
      // e.g. 409: the category is still used by transactions
      toast.error(getErrorMessage(err));
      setCatToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const openNewCategory = () => {
    setEditingCat(null);
    setCatModalOpen(true);
  };
  const openEditCategory = (category) => {
    setEditingCat(category);
    setCatModalOpen(true);
  };

  if (!summary && loading) return <PageLoader />;
  if (!summary) return null;

  const { budget, budgetStats } = summary;
  const visibleCategories = categories.filter((c) => c.type === catType);

  return (
    <div className="space-y-8">
      {/* ---------------- Budget ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Monthly budget</h2>
            <p className="text-sm text-muted">Set a spending limit for {monthLabel(month)}.</p>
          </div>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {budgetStats.status === 'exceeded' && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger" role="alert">
            <TriangleAlert size={18} className="shrink-0" />
            Budget exceeded! You have spent {formatCurrency(Math.abs(budgetStats.remaining))} more than your {formatCurrency(budgetStats.amount)} budget.
          </div>
        )}
        {budgetStats.status === 'warning' && (
          <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning" role="alert">
            <TriangleAlert size={18} className="shrink-0" />
            Careful: {budgetStats.percentage}% of your budget is used. Only {formatCurrency(budgetStats.remaining)} left.
          </div>
        )}
        {budgetStats.status === 'safe' && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
            <CircleCheck size={18} className="shrink-0" /> You are on track: {formatCurrency(budgetStats.remaining)} remaining this month.
          </div>
        )}

        <div className={`grid gap-6 lg:grid-cols-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <form onSubmit={saveBudget} className="card p-5" noValidate>
            <h3 className="font-semibold text-ink">{budget ? 'Edit budget' : 'Set budget'}</h3>
            <p className="mb-4 text-sm text-muted">{budget ? `Current: ${formatCurrency(budget.amount)}` : 'No budget set for this month yet.'}</p>
            <label className="label" htmlFor="budget-amount">Budget amount</label>
            <input id="budget-amount" type="number" inputMode="decimal" min="0" step="0.01" className="input" placeholder="e.g. 20000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {amountError && <p className="field-error">{amountError}</p>}
            <button type="submit" className="btn btn-primary mt-4 w-full" disabled={saving}>
              {saving && <Spinner size={16} />} {budget ? 'Update budget' : 'Save budget'}
            </button>
          </form>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-ink">Spending vs budget</h3>
            <BudgetProgress stats={budgetStats} />
          </div>
        </div>
      </section>

      {/* ---------------- Categories ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Categories</h2>
            <p className="text-sm text-muted">Organise your transactions your way.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openNewCategory}>
            <Plus size={18} /> New category
          </button>
        </div>

        <div className="inline-grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCatType(t)}
              className={`rounded-lg px-6 py-2 text-sm font-semibold capitalize transition-all ${
                catType === t ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {catsLoading ? (
          <PageLoader />
        ) : visibleCategories.length === 0 ? (
          <div className="card">
            <EmptyState icon={Tags} title={`No ${catType} categories`} text="Create one to start organising your transactions." action={<button className="btn btn-primary" onClick={openNewCategory}><Plus size={16} /> New category</button>} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((c) => (
              <div key={c._id} className="card flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CategoryIcon name={c.icon} tone={c.type} />
                <p className="min-w-0 flex-1 truncate font-semibold text-ink">{c.name}</p>
                <button type="button" className="icon-btn" onClick={() => openEditCategory(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil size={16} />
                </button>
                <button type="button" className="icon-btn hover:text-danger" onClick={() => setCatToDelete(c)} aria-label={`Delete ${c.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <CategoryModal open={catModalOpen} onClose={() => setCatModalOpen(false)} onSaved={reloadCategories} category={editingCat} defaultType={catType} />

      <ConfirmDialog
        open={Boolean(catToDelete)}
        title="Delete category?"
        message={catToDelete ? `"${catToDelete.name}" will be removed. Categories that still have transactions cannot be deleted.` : ''}
        loading={deleting}
        onConfirm={confirmDeleteCategory}
        onClose={() => setCatToDelete(null)}
      />
    </div>
  );
}
