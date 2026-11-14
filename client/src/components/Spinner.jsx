import { LoaderCircle } from 'lucide-react';

export default function Spinner({ size = 20, className = '' }) {
  return <LoaderCircle size={size} className={`animate-spin ${className}`} aria-label="Loading" />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted">
      <Spinner size={28} />
    </div>
  );
}
