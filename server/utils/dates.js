// All dates are stored as UTC midnight of the calendar day the user picked.
// The frontend sends "YYYY-MM-DD", so a transaction on 2026-11-30 stays on
// 30 Nov in every timezone and never slips into another month.

export const parseDateOnly = (value) => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? date : null;
};

// Start (inclusive) and end (exclusive) of a month, in UTC.
export const monthRange = (year, month) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  end: new Date(Date.UTC(year, month, 1)),
});

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
