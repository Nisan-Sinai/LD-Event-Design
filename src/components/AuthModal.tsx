import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, X } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';

/**
 * מודאל התחברות/הרשמה inline — נפתח בשלב אישור ההזמנה עבור אורחים,
 * כך שכל מה שהוזן בהזמנה נשאר על המסך. בהצלחה — קורא ל-onSuccess.
 */
export function AuthModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { t, dir } = useI18n();
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const google = async () => {
    setError(null);
    if (!configured) {
      setError(t('auth.notConfigured'));
      return;
    }
    setBusy(true);
    const { error: gErr } = await signInWithGoogle();
    setBusy(false);
    if (gErr) setError(gErr);
    // בהצלחה — Supabase מבצע redirect לגוגל וחזרה; אין צורך ב-onSuccess כאן
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError(t('auth.notConfigured'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.shortPassword'));
      return;
    }
    setBusy(true);
    if (tab === 'register') {
      // אם המייל כבר רשום — signUp ייכשל וננסה התחברות ישירה מיד אחריו
      await signUp(email.trim(), password);
    }
    const err = (await signIn(email.trim(), password)).error;
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onSuccess();
  };

  const inputCls =
    'w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]';
  const tabCls = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
      active ? 'bg-[#B29259] text-white shadow-sm' : 'text-gray-600 hover:text-[#B29259]'
    }`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 pb-8 sm:p-8 shadow-xl animate-sheetUp sm:animate-rise max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* ידית גרירה (מובייל) */}
        <div className="sm:hidden mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 id="auth-modal-title" className="font-display text-xl font-bold text-[#8C6D3F]">
            {t('auth.gateTitle')}
          </h2>
          <button type="button" onClick={onClose} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700 shrink-0">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">{t('auth.gateSub')}</p>

        {/* התחברות עם Google */}
        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2.5 border border-gray-200 hover:border-[#B29259] rounded-2xl py-2.5 text-sm font-bold text-gray-700 transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
          </svg>
          {t('auth.google')}
        </button>

        {/* מפריד "או" */}
        <div className="flex items-center gap-3 my-4 text-[11px] text-gray-400">
          <span className="h-px bg-[#EAE3D2] flex-1" />
          {t('auth.or')}
          <span className="h-px bg-[#EAE3D2] flex-1" />
        </div>

        <div className="flex bg-[#FAF7F2] border border-[#EAE3D2] rounded-2xl p-1 mb-5" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')} className={tabCls(tab === 'register')}>
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            {t('auth.tabRegister')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => setTab('login')} className={tabCls(tab === 'login')}>
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            {t('auth.tabLogin')}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="am-email" className="block text-xs font-bold text-gray-700 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-4 h-4" aria-hidden="true" /></span>
              <input id="am-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} dir="ltr" />
            </div>
          </div>
          <div>
            <label htmlFor="am-password" className="block text-xs font-bold text-gray-700 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" aria-hidden="true" /></span>
              <input id="am-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            {tab === 'register' && <p className="text-[10px] text-gray-400 mt-1">{t('auth.passwordHint')}</p>}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="sheen w-full bg-[#B29259] hover:bg-[#8C6D3F] text-white py-3 rounded-2xl font-bold text-sm shadow-sm transition-colors disabled:opacity-60"
          >
            {busy ? t('auth.working') : tab === 'register' ? t('auth.registerBtn') : t('auth.loginBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
