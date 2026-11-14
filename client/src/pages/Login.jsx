import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { isValidEmail } from '../utils/validators';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in? Go straight to the dashboard.
  if (user) return <Navigate to="/dashboard" replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Finora account."
      footer={
        <>
          New to Finora?{' '}
          <Link to="/signup" className="font-semibold text-accent hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" /> {serverError}
          </div>
        )}

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
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input px-10" placeholder="Your password" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
          {loading && <Spinner size={18} />} {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
