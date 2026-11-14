import { formatCurrency } from '../utils/format';

const BAR = { safe: 'bg-accent', warning: 'bg-warning', exceeded: 'bg-danger', none: 'bg-line' };
const TEXT = { safe: 'text-accent', warning: 'text-warning', exceeded: 'text-danger', none: 'text-muted' };

// stats = budgetStats from GET /api/dashboard/summary
export default function BudgetProgress({ stats }) {
  const { amount, spent, remaining, percentage, status } = stats;
  const hasBudget = status !== 'none';
  const width = Math.min(percentage, 100);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Spent this month</p>
          <p className="text-2xl font-bold text-ink">{formatCurrency(spent)}</p>
        </div>
        {hasBudget && <p className={`text-2xl font-bold ${TEXT[status]}`}>{percentage}%</p>}
      </div>

      <div
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasBudget ? Math.round(width) : 0}
      >
        <div className={`h-full rounded-full transition-all duration-700 ${BAR[status]}`} style={{ width: `${width}%` }} />
      </div>

      {hasBudget ? (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted">Monthly budget</p>
            <p className="font-semibold text-ink">{formatCurrency(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted">{remaining < 0 ? 'Over budget by' : 'Remaining'}</p>
            <p className={`font-semibold ${remaining < 0 ? 'text-danger' : 'text-ink'}`}>
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No budget set for this month yet.</p>
      )}
    </div>
  );
}
