import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, TriangleAlert, Check, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { isValidEmail, isStrongPassword, passwordChecks } from '../utils/validators';

export default function Signup() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const checks = passwordChecks(form.password);
  const score = checks.filter((c) => c.ok).length;
  const strengthColor = ['bg-line', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-accent'][score];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name (at least 2 characters)';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    else if (!isStrongPassword(form.password)) next.password = 'Password does not meet all the requirements below';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.confirmPassword);
      toast.success('Account created. Welcome to Finora!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Sign up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking your finances in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" /> {serverError}
          </div>
        )}

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <div className="relative">
            <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input id="name" autoComplete="name" className="input pl-10" placeholder="Jane Doe" value={form.name} onChange={set('name')} maxLength={60} />
          </div>
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input id="email" type="email" autoComplete="email" className="input pl-10" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="input px-10" placeholder="Create a strong password" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}

          {form.password && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? strengthColor : 'bg-line'}`} />
                ))}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {checks.map((c) => (
                  <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-accent' : 'text-muted'}`}>
                    {c.ok ? <Check size={13} /> : <Circle size={13} />} {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="input pl-10" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          </div>
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
          {loading && <Spinner size={18} />} {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
