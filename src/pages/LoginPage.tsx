import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, KeyRound, Lock, LogIn, Mail } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
import { GoogleButton, OrDivider } from '../components/GoogleButton';

export function LoginPage() {
  const { t, lang } = useI18n();
  const { signIn, resetPassword, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/order';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setNotice(
      lang === 'he'
        ? 'שלחנו קישור לאיפוס הסיסמה למייל. יש לפתוח אותו מאותו מכשיר ולהגדיר סיסמה חדשה.'
        : 'A password reset link was sent to your email. Open it on this device to choose a new password.'
    );
  };

  const inputCls = 'w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EAE3D2]">
        <h2 className="text-xl font-bold text-[#8C6D3F] flex items-center gap-2 mb-2">
          {resetMode ? (
            <KeyRound className="w-5 h-5 text-[#B29259]" aria-hidden="true" />
          ) : (
            <LogIn className="w-5 h-5 text-[#B29259]" aria-hidden="true" />
          )}
          {resetMode
            ? lang === 'he' ? 'איפוס סיסמה' : 'Reset password'
            : t('auth.loginTitle')}
        </h2>

        {resetMode && (
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            {lang === 'he'
              ? 'הזינו את כתובת המייל של המנהלת ונשלח אליה קישור מאובטח.'
              : 'Enter the manager email and we will send a secure reset link.'}
          </p>
        )}

        {!configured && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-xl mb-4" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
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
            <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-4 h-4" aria-hidden="true" /></span>
              <input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputCls} dir="ltr" autoComplete="email" />
            </div>
          </div>

          {!resetMode && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="block text-xs font-bold text-gray-700">{t('auth.password')}</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-xs font-bold text-[#8C6D3F] underline underline-offset-2 hover:text-[#B29259]"
                >
                  {lang === 'he' ? 'שכחתי סיסמה' : 'Forgot password'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" aria-hidden="true" /></span>
                <input id="login-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputCls} dir="ltr" autoComplete="current-password" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-700" role="status">
              {notice}
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full bg-[#B29259] hover:bg-[#8C6D3F] text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-60">
            {busy
              ? t('auth.working')
              : resetMode
                ? lang === 'he' ? 'שליחת קישור איפוס' : 'Send reset link'
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
            {lang === 'he' ? 'חזרה להתחברות' : 'Back to login'}
          </button>
        ) : (
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#8C6D3F] font-bold underline">{t('auth.toRegister')}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
