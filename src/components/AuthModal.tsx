import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, SignUpData } from '../lib/AuthContext';
import { XIcon, StoreIcon } from './Icons';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // Sign-up fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  // Sign-in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  // Lightweight validators for the new fields
  const validateMobile = (m: string) => /^[\d+\-\s()]{7,20}$/.test(m.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) return setError('Please enter your name.');
      if (!mobile.trim()) return setError('Please enter your mobile number.');
      if (!validateMobile(mobile))
        return setError('Please enter a valid mobile number.');
      if (password.length < 6)
        return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        const data: SignUpData = {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          password,
        };
        await signUp(data);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur"
      onClick={onClose}
      style={{ minHeight: '100vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        style={{ margin: 'auto' }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <XIcon size={18} />
        </button>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <StoreIcon size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="truncate text-xs text-indigo-100">
                {mode === 'signin'
                  ? 'Sign in to view product details & chat with sellers'
                  : 'Join Mobile Expert in seconds — it’s free'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Sign-up only fields */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+94 75 123 4567"
                  autoComplete="tel"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading
              ? 'Please wait…'
              : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </button>

          <p className="pt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
}
