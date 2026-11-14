import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budget & Categories', icon: PiggyBank },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30">
            <Wallet size={22} />
          </span>
          <div>
            <p className="text-lg font-bold leading-tight tracking-tight">Finora</p>
            <p className="text-[11px] leading-tight text-white/60">Personal Finance Manager</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/12 text-white shadow-inner' : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-white/60">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
