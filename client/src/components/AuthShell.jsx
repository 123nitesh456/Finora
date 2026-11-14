import { Wallet, ShieldCheck, PieChart, TrendingUp } from 'lucide-react';

const points = [
  { icon: PieChart, text: 'See exactly where your money goes' },
  { icon: TrendingUp, text: 'Track income, expenses and monthly budgets' },
  { icon: ShieldCheck, text: 'Private by design: only you can see your data' },
];

// Two-column layout used by the Login and Signup pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-page lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30">
            <Wallet size={24} />
          </span>
          <span className="text-2xl font-bold tracking-tight">Finora</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Take control of your money, one transaction at a time.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={18} className="text-accent" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">Finora — Personal Finance Manager</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="animate-fade-up w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Wallet size={22} />
            </span>
            <span className="text-xl font-bold text-ink">Finora</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}
