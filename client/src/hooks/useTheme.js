import { useEffect, useState } from 'react';

// Light/dark mode. The "dark" class on <html> switches the CSS variables in index.css.
export default function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('finora_theme', dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable - ignore */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
