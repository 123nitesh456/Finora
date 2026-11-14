import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Download, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import useCategories from '../hooks/useCategories';
import useDebounce from '../hooks/useDebounce';
import TransactionTable from '../components/TransactionTable';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { downloadCSV } from '../utils/csv';
import { formatCurrency } from '../utils/format';

const defaultFilters = { search: '', type: '', category: '', startDate: '', endDate: '', sort: 'newest' };

export default function Transactions() {
  const [filters, setFilters] = useState(defaultFilters);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { categories } = useCategories();

  // Wait until the user stops typing before calling the API.
  const debouncedSearch = useDebounce(filters.search);

  // Reload the list whenever a filter changes or a transaction is added/edited/deleted.
  useEffect(() => {
    let ignore = false;
    const params = { sort: filters.sort };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    setLoading(true);
    api
      .get('/transactions', { params })
      .then((res) => !ignore && setTransactions(res.data.transactions))
      .catch((err) => !ignore && toast.error(getErrorMessage(err, 'Could not load transactions')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [debouncedSearch, filters.type, filters.category, filters.startDate, filters.endDate, filters.sort, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const hasFilters = Boolean(
    filters.search || filters.type || filters.category || filters.startDate || filters.endDate
  );

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((n, t) => n + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((n, t) => n + t.amount, 0);
    return { income, expenses };
  }, [transactions]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (transaction) => {
    setEditing(transaction);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/transactions/${toDelete._id}`);
      toast.success('Transaction deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    const rows = [
      ['Date', 'Title', 'Type', 'Category', 'Amount', 'Notes'],
      ...transactions.map((t) => [t.date.slice(0, 10), t.title, t.type, t.category?.name || '', t.amount, t.notes || '']),
    ];
    downloadCSV('finora-transactions.csv', rows);
    toast.success(`Exported ${transactions.length} transactions`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Transactions</h2>
          <p className="text-sm text-muted">
            {transactions.length} shown ·{' '}
            <span className="font-medium text-accent">{formatCurrency(totals.income)} in</span> ·{' '}
            <span className="font-medium text-danger">{formatCurrency(totals.expenses)} out</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn btn-ghost" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Search by title…" value={filters.search} onChange={setFilter('search')} aria-label="Search transactions" />
        </div>
        <select className="input" value={filters.type} onChange={setFilter('type')} aria-label="Filter by type">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="input" value={filters.category} onChange={setFilter('category')} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name} ({c.type})</option>
          ))}
        </select>
        <select className="input" value={filters.sort} onChange={setFilter('sort')} aria-label="Sort order">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
          <label className="text-xs font-medium text-muted" htmlFor="from">From</label>
          <input id="from" type="date" className="input" value={filters.startDate} max={filters.endDate || undefined} onChange={setFilter('startDate')} />
          <label className="text-xs font-medium text-muted" htmlFor="to">To</label>
          <input id="to" type="date" className="input" value={filters.endDate} min={filters.startDate || undefined} onChange={setFilter('endDate')} />
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-ghost lg:col-span-3 lg:justify-self-start" onClick={() => setFilters(defaultFilters)}>
            <X size={16} /> Clear filters
          </button>
        )}
      </div>

      <TransactionTable
        transactions={transactions}
        loading={loading}
        filtered={hasFilters}
        onEdit={openEdit}
        onDelete={setToDelete}
        emptyAction={
          !hasFilters && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add transaction
            </button>
          )
        }
      />

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={reload} transaction={editing} categories={categories} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete transaction?"
        message={toDelete ? `"${toDelete.title}" (${formatCurrency(toDelete.amount)}) will be permanently removed and your balance will be recalculated.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
