import { Pencil, Trash2, ReceiptText } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import EmptyState from './EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-t border-line">
      <td className="px-5 py-4" colSpan={6}>
        <div className="skeleton h-8 w-full" />
      </td>
    </tr>
  ));
}

export default function TransactionTable({ transactions, loading, onEdit, onDelete, emptyAction, filtered }) {
  const showEmpty = !loading && transactions.length === 0;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-soft/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Transaction</th>
              <th className="hidden px-5 py-3 font-semibold md:table-cell">Category</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="hidden px-5 py-3 font-semibold lg:table-cell">Notes</th>
              <th className="px-5 py-3 text-right font-semibold">Amount</th>
              <th className="px-5 py-3 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && transactions.length === 0 && <SkeletonRows />}

            {transactions.map((t) => {
              const income = t.type === 'income';
              return (
                <tr key={t._id} className="border-t border-line transition-colors hover:bg-soft/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CategoryIcon name={t.category?.icon} tone={income ? 'income' : 'expense'} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{t.title}</p>
                        <p className="truncate text-xs text-muted md:hidden">{t.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-ink">
                      {t.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted">{formatDate(t.date)}</td>
                  <td className="hidden max-w-[14rem] truncate px-5 py-3.5 text-muted lg:table-cell">{t.notes || '—'}</td>
                  <td className={`whitespace-nowrap px-5 py-3.5 text-right font-semibold ${income ? 'text-accent' : 'text-danger'}`}>
                    {income ? '+' : '−'}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right">
                    <button type="button" className="icon-btn" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="icon-btn hover:text-danger" onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showEmpty && (
        <EmptyState
          icon={ReceiptText}
          title={filtered ? 'No transactions match your filters' : 'No transactions yet'}
          text={
            filtered
              ? 'Try a different search term, or clear the filters.'
              : 'Add your first income or expense to start tracking your money.'
          }
          action={emptyAction}
        />
      )}
    </div>
  );
}
