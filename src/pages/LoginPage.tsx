import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, KeyRound, Lock, LogIn, Mail } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
import { GoogleButton, OrDivider } from '../components/GoogleButton';

const AUTH_RETURN_KEY = 'ld-event-design-auth-return';

function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
}

export function LoginPage() {
  const { t } = useI18n();
  const { user, role, signIn, resetPassword, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(() => {
    const stateFrom = (location.state as { from?: string } | null)?.from;
    const queryFrom = new URLSearchParams(location.search).get('from');
    const storedFrom = window.sessionStorage.getItem(AUTH_RETURN_KEY);
    return safeReturnPath(stateFrom ?? queryFrom ?? storedFrom);
  }, [location.search, location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem(AUTH_RETURN_KEY, from);
  }, [from]);

  useEffect(() => {
    if (!user || role !== 'admin') return;
    window.sessionStorage.removeItem(AUTH_RETURN_KEY);
    navigate(from, { replace: true });
  }, [from, navigate, role, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!configured) {
      setError(t('auth.notConfigured'));
      return;
    }
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    window.sessionStorage.removeItem(AUTH_RETURN_KEY);
    navigate(from, { replace: true });
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!configured) {
      setError(t('auth.notConfigured'));
      return;
    }
    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(t('auth.resetLinkSent'));
  };

  const openResetMode = () => {
    setResetMode(true);
    setError(null);
    setNotice(null);
  };

  const inputCls = 'w-full ps-9 pe-3 py-3 bg-[#FAF7F2] border border-[#E8DED2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/35 focus:border-[#B29259]';

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-[1.75rem] border border-[#E8C5B8]/70 bg-white p-6 shadow-[0_24px_70px_rgba(140,109,63,0.12)] sm:p-8">
        <h2 className="mb-2 flex items-center gap-2 font-display text-2xl font-black text-[#8C6D3F]">
          {resetMode ? (
            <KeyRound className="h-6 w-6 text-[#B29259]" aria-hidden="true" />
          ) : (
            <LogIn className="h-6 w-6 text-[#B29259]" aria-hidden="true" />
          )}
          {resetMode ? t('auth.resetTitle') : t('auth.loginTitle')}
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          {resetMode ? t('auth.resetSub') : t('auth.loginSub')}
        </p>

        {!configured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t('auth.notConfigured')}
          </div>
        )}

        {!resetMode && (
          <>
            <GoogleButton onError={setError} returnTo={from} />
            <OrDivider />
          </>
        )}

        <form onSubmit={resetMode ? submitReset : submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-gray-700">{t('auth.email')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="h-4 w-4" aria-hidden="true" /></span>
              <input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputCls} dir="ltr" autoComplete="email" />
            </div>
          </div>

          {!resetMode && (
            <>
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-gray-700">{t('auth.password')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="h-4 w-4" aria-hidden="true" /></span>
                  <input id="login-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputCls} dir="ltr" autoComplete="current-password" />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8C5B8] bg-gradient-to-br from-[#FDFBF7] to-[#F4E3E3]/55 p-3.5 shadow-sm">
                <p className="text-sm font-black text-[#5A4636]">
                  {t('auth.forgotTitle')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#786A60]">
                  {t('auth.forgotSub')}
                </p>
                <button
                  type="button"
                  onClick={openResetMode}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#B8860B] bg-white px-4 py-3 text-sm font-black text-[#8C6D3F] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#B8860B] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/25"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {t('auth.forgotBtn')}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-700" role="status">
              {notice}
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#B8860B] to-[#D4AF37] py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(184,134,11,0.22)] transition hover:-translate-y-0.5 disabled:opacity-60">
            {busy
              ? t('auth.working')
              : resetMode
                ? t('auth.sendResetLink')
                : t('auth.loginBtn')}
          </button>
        </form>

        {resetMode ? (
          <button
            type="button"
            onClick={() => {
              setResetMode(false);
              setError(null);
              setNotice(null);
            }}
            className="mx-auto mt-4 flex items-center gap-1 text-xs font-bold text-[#8C6D3F] hover:text-[#B29259]"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            {t('auth.backToLogin')}
          </button>
        ) : (
          <p className="mt-4 text-center text-xs text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-bold text-[#8C6D3F] underline">{t('auth.toRegister')}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
