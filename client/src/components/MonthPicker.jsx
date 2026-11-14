import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseMonthValue } from '../utils/format';

const shift = (value, delta) => {
  const { year, month } = parseMonthValue(value);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

// value / onChange use "YYYY-MM"
export default function MonthPicker({ value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface shadow-sm">
      <button type="button" className="icon-btn rounded-r-none" onClick={() => onChange(shift(value, -1))} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <input
        type="month"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="w-[9.5rem] cursor-pointer bg-transparent px-1 py-2 text-center text-sm font-semibold text-ink focus:outline-none"
        aria-label="Select month"
      />
      <button type="button" className="icon-btn rounded-l-none" onClick={() => onChange(shift(value, 1))} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
