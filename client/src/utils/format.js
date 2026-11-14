// Change these two lines to switch currency (e.g. 'USD' and 'en-US').
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

export const formatCurrency = (value = 0) => currencyFormatter.format(Number(value) || 0);

// Dates from the API are UTC midnight of the chosen day, so format them in UTC.
// This keeps "30 Nov" as "30 Nov" in every timezone.
export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// "YYYY-MM-DD" for <input type="date"> from an API date.
export const toInputDate = (value) => new Date(value).toISOString().slice(0, 10);

const pad = (n) => String(n).padStart(2, '0');

// Today in the user's LOCAL calendar, as "YYYY-MM-DD".
export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Current month as "YYYY-MM" (the value format of <input type="month">).
export const currentMonthValue = () => todayInput().slice(0, 7);

export const parseMonthValue = (value) => {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
};

export const monthLabel = (value) => {
  const { year, month } = parseMonthValue(value);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

// First and last day of a "YYYY-MM" month as "YYYY-MM-DD".
export const monthBounds = (value) => {
  const { year, month } = parseMonthValue(value);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${value}-01`, end: `${value}-${pad(lastDay)}` };
};
