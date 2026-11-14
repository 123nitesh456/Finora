export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// Same rules as the backend: 8+ chars, lowercase, uppercase, number.
export const passwordChecks = (password) => [
  { label: 'At least 8 characters', ok: password.length >= 8 },
  { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
  { label: 'One number', ok: /\d/.test(password) },
];

export const isStrongPassword = (password) => passwordChecks(password).every((c) => c.ok);
