import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budget & Categories',
};

export default function Navbar({ onMenu }) {
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-page/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="icon-btn lg:hidden" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-ink">{TITLES[pathname] || 'Finora'}</h1>
          <p className="hidden text-xs text-muted sm:block">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      <button type="button" onClick={toggle} className="icon-btn border border-line bg-surface" aria-label="Toggle dark mode" title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
