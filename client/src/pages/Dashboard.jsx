import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Wallet, TrendingUp, TrendingDown, Target, Plus, Download, ArrowRight, Inbox, TriangleAlert,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import api, { getErrorMessage } from '../services/api';
import useCategories from '../hooks/useCategories';
import StatCard from '../components/StatCard';
import BudgetProgress from '../components/BudgetProgress';
import MonthPicker from '../components/MonthPicker';
import TransactionModal from '../components/TransactionModal';
import CategoryIcon from '../components/CategoryIcon';
import EmptyState from '../components/EmptyState';
import { PageLoader } from '../components/Spinner';
import { downloadCSV } from '../utils/csv';
import {
  currentMonthValue, formatCurrency, formatDate, monthBounds, monthLabel, parseMonthValue,
} from '../utils/format';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#64748B'];

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--ink)',
  fontSize: 13,
};

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonthValue());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reporting, setReporting] = useState(false);
  const { categories } = useCategories();

  // Re-fetch whenever the month changes or a transaction is saved.
  useEffect(() => {
    let ignore = false;
    const { year, month: m } = parseMonthValue(month);
    setLoading(true);
    api
      .get('/dashboard/summary', { params: { month: m, year } })
      .then((res) => {
        if (ignore) return;
        setSummary(res.data);
        setError('');
      })
      .catch((err) => !ignore && setError(getErrorMessage(err, 'Could not load your dashboard')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const downloadReport = async () => {
    if (!summary) return;
    setReporting(true);
    try {
      const { start, end } = monthBounds(month);
      const { data } = await api.get('/transactions', { params: { startDate: start, endDate: end, sort: 'oldest' } });
      const rows = [
        ['Finora monthly report', monthLabel(month)],
        [],
        ['Summary'],
        ['Income', summary.monthly.income],
        ['Expenses', summary.monthly.expenses],
        ['Net savings', summary.monthly.net],
        ['Monthly budget', summary.budget ? summary.budget.amount : 'Not set'],
        ['Budget used (%)', summary.budget ? summary.budgetStats.percentage : 'n/a'],
        ['Remaining budget', summary.budget ? summary.budgetStats.remaining : 'n/a'],
        [],
        ['Expenses by category'],
        ['Category', 'Amount', 'Transactions'],
        ...summary.categoryBreakdown.map((c) => [c.name, c.total, c.count]),
        [],
        ['Transactions'],
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Notes'],
        ...data.transactions.map((t) => [t.date.slice(0, 10), t.title, t.type, t.category?.name || '', t.amount, t.notes || '']),
      ];
      downloadCSV(`finora-report-${month}.csv`, rows);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create the report'));
    } finally {
      setReporting(false);
    }
  };

  if (!summary && loading) return <PageLoader />;
  if (!summary && error) {
    return (
      <div className="card">
        <EmptyState icon={TriangleAlert} title="Something went wrong" text={error} action={<button className="btn btn-primary" onClick={reload}>Try again</button>} />
      </div>
    );
  }

  const { totals, monthly, budgetStats, budget, categoryBreakdown, monthlyChart, recentTransactions } = summary;
  const expenseTotal = categoryBreakdown.reduce((n, c) => n + c.total, 0);
  const budgetValue = budget ? formatCurrency(budget.amount) : 'Not set';

  return (
    <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">{monthLabel(month)}</h2>
          <p className="text-sm text-muted">Your financial overview for the selected month.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-ghost" onClick={downloadReport} disabled={reporting}>
            <Download size={16} /> Report
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Add transaction
          </button>
        </div>
      </div>

      {/* Budget alerts */}
      {budgetStats.status === 'exceeded' && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger" role="alert">
          <TriangleAlert size={18} /> You are {formatCurrency(Math.abs(budgetStats.remaining))} over your budget this month.
        </div>
      )}
      {budgetStats.status === 'warning' && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning" role="alert">
          <TriangleAlert size={18} /> You have used {budgetStats.percentage}% of your budget. {formatCurrency(budgetStats.remaining)} left.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total balance" value={formatCurrency(totals.balance)} icon={Wallet} tone="navy" hint="All income minus all expenses" valueClassName={totals.balance < 0 ? 'text-danger' : ''} />
        <StatCard title="Total income" value={formatCurrency(totals.income)} icon={TrendingUp} tone="green" hint={`${formatCurrency(monthly.income)} this month`} />
        <StatCard title="Total expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} tone="red" hint={`${formatCurrency(monthly.expenses)} this month`} />
        <StatCard title="Monthly budget" value={budgetValue} icon={Target} tone="amber" hint={budget ? `${formatCurrency(budgetStats.remaining)} remaining` : 'Set one on the Budget page'} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h3 className="font-semibold text-ink">Income vs expenses</h3>
          <p className="mb-4 text-sm text-muted">Last 6 months</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} barGap={4} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip cursor={{ fill: 'var(--soft)' }} contentStyle={tooltipStyle} formatter={(value, name) => [formatCurrency(value), name]} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-5 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Expenses</span>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-ink">Spending by category</h3>
          <p className="mb-2 text-sm text-muted">{monthLabel(month)}</p>
          {categoryBreakdown.length === 0 ? (
            <EmptyState icon={Inbox} title="No expenses this month" text="Add an expense to see your breakdown." />
          ) : (
            <>
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="total" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">
                      {categoryBreakdown.map((c, i) => (
                        <Cell key={c.categoryId || c.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatCurrency(value), name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted">Total</span>
                  <span className="text-lg font-bold text-ink">{formatCurrency(expenseTotal)}</span>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {categoryBreakdown.slice(0, 6).map((c, i) => (
                  <li key={c.categoryId || c.name} className="flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate text-ink">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatCurrency(c.total)} · {Math.round((c.total / expenseTotal) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Budget + monthly overview + recent */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Budget utilisation</h3>
              <Link to="/budgets" className="text-sm font-medium text-accent hover:underline">Manage</Link>
            </div>
            <BudgetProgress stats={budgetStats} />
          </section>

          <section className="card p-5">
            <h3 className="mb-4 font-semibold text-ink">Monthly spending overview</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Income</dt><dd className="font-semibold text-accent">{formatCurrency(monthly.income)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Expenses</dt><dd className="font-semibold text-danger">{formatCurrency(monthly.expenses)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3"><dt className="text-muted">Net savings</dt><dd className={`font-semibold ${monthly.net < 0 ? 'text-danger' : 'text-ink'}`}>{formatCurrency(monthly.net)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Transactions</dt><dd className="font-semibold text-ink">{monthly.transactionCount}</dd></div>
            </dl>
          </section>
        </div>

        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-semibold text-ink">Recent transactions</h3>
            <Link to="/transactions" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No transactions yet"
              text="Your latest activity will show up here."
              action={<button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add transaction</button>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentTransactions.map((t) => (
                <li key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                  <CategoryIcon name={t.category?.icon} tone={t.type === 'income' ? 'income' : 'expense'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
                    <p className="truncate text-xs text-muted">{t.category?.name || 'Uncategorized'} · {formatDate(t.date)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${t.type === 'income' ? 'text-accent' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={reload} transaction={null} categories={categories} />
    </div>
  );
}
