/**
 * AuthScreen — shown when no Firebase user is signed in.
 * MriShan Drive — Glassmorphism light auth UI with email/password + Google sign-in.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle
} from './services/firebase';

const MRISHAN_LOGO = '/image.png';

function friendlyError(code: string) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createAccountWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 theme-root-bg"
    >
      {/* Soft gradient orbs */}
      <div className="pointer-events-none absolute rounded-full opacity-30 blur-[120px] h-[480px] w-[480px] bg-blue-300 -top-24 -left-24" />
      <div className="pointer-events-none absolute rounded-full opacity-20 blur-[120px] h-[400px] w-[400px] bg-violet-300 bottom-0 -right-20" />
      <div className="pointer-events-none absolute rounded-full opacity-20 blur-[80px] h-[280px] w-[280px] bg-indigo-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '200px 200px'
        }}
      />

      <div
        className="relative w-full max-w-[400px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 600ms ease, transform 600ms ease'
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 24px rgba(99,102,241,0.15)'
            }}
          >
            <img
              src={MRISHAN_LOGO}
              alt="MriShan Drive"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="text-center">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: '#0F172A' }}
            >
              MriShan Drive
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {mode === 'signin' ? 'Welcome back' : 'Create your workspace'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 40px rgba(99,102,241,0.12)'
          }}
        >
          {/* Tab switcher */}
          <div className="flex border-b border-white/40">
            {(['signin', 'signup'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                className="flex-1 py-3.5 text-sm font-medium tracking-wide transition-all duration-200"
                style={{
                  color: mode === tab ? 'var(--accent-primary)' : '#94a3b8',
                  borderBottom: mode === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  background: mode === tab ? 'rgba(59,130,246,0.06)' : 'transparent'
                }}
              >
                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="group mb-5 flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                color: '#334155',
                backdropFilter: 'blur(8px)'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 18.6 7.4l2.83-2.83A11.94 11.94 0 0 0 2.25 8.25l3.02 1.51Z" />
                  <path fill="#34A853" d="M16.04 18.01A7.06 7.06 0 0 1 4.89 14.5L1.86 16a11.95 11.95 0 0 0 17.48 3.23l-3.3-1.22Z" />
                  <path fill="#4A90D9" d="M19.6 7.4a11.9 11.9 0 0 1 .4 9.8l-3.3-1.22a7.08 7.08 0 0 0-.62-5.75L19.6 7.4Z" />
                  <path fill="#FBBC05" d="M12 4.93A7.06 7.06 0 0 1 18.6 7.4l2.83-2.83A11.95 11.95 0 0 0 5.27 9.76l3.02 1.51A7.07 7.07 0 0 1 12 4.93Z" />
                  <path fill="#4A90D9" d="M23 12c0-.66-.06-1.31-.17-1.93H12v3.66h6.18a5.3 5.3 0 0 1-2.28 3.46l3.3 1.22A11.94 11.94 0 0 0 23 12Z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or with email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div className="group relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      borderRadius: '10px',
                      backdropFilter: 'blur(8px)'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(8px)'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(8px)'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 text-xs text-red-600"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px'
                  }}
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-1 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  borderRadius: '10px',
                  border: 'none',
                  boxShadow: '0 2px 16px rgba(99,102,241,0.35)',
                  transition: 'filter var(--transition-ui), transform var(--transition-ui)'
                }}
                onMouseEnter={e => { if (!loading && !googleLoading) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer toggle */}
        <p className="mt-5 text-center text-xs text-slate-500">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-medium transition-colors hover:underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Your files are private and only visible to you.
        </p>
      </div>
    </div>
  );
}
