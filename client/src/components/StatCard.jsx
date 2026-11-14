const TONES = {
  navy: 'bg-primary/10 text-primary',
  green: 'bg-accent/15 text-accent',
  red: 'bg-danger/10 text-danger',
  amber: 'bg-warning/15 text-warning',
};

export default function StatCard({ title, value, hint, icon: Icon, tone = 'navy', valueClassName = '' }) {
  return (
    <div className="card animate-fade-up p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className={`mt-2 truncate text-2xl font-bold tracking-tight text-ink ${valueClassName}`}>{value}</p>
        </div>
        {Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
            <Icon size={22} />
          </span>
        )}
      </div>
      {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
    </div>
  );
}
