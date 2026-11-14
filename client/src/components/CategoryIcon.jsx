import { getIcon } from '../utils/icons';

// Rounded tile with a category icon. `tone` colours it: soft | income | expense
export default function CategoryIcon({ name, size = 18, tone = 'soft', className = '' }) {
  const Icon = getIcon(name);
  const tones = {
    soft: 'bg-soft text-muted',
    income: 'bg-accent/15 text-accent',
    expense: 'bg-danger/10 text-danger',
  };
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]} ${className}`}>
      <Icon size={size} />
    </span>
  );
}
