import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
import { GoogleButton, OrDivider } from '../components/GoogleButton';

export function LoginPage() {
  const { t } = useI18n();
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/order';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError(t('auth.notConfigured'));
      return;
    }
    setBusy(true);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate(from, { replace: true });
  };

  const inputCls = 'w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EAE3D2]">
        <h2 className="text-xl font-bold text-[#8C6D3F] flex items-center gap-2 mb-5">
          <LogIn className="w-5 h-5 text-[#B29259]" aria-hidden="true" />
          {t('auth.loginTitle')}
        </h2>

        {!configured && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-xl mb-4" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {t('auth.notConfigured')}
          </div>
        )}

        <GoogleButton onError={setError} />
        <OrDivider />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-4 h-4" aria-hidden="true" /></span>
              <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} dir="ltr" />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" aria-hidden="true" /></span>
              <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} dir="ltr" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full bg-[#B29259] hover:bg-[#8C6D3F] text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-60">
            {busy ? t('auth.working') : t('auth.loginBtn')}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[#8C6D3F] font-bold underline">{t('auth.toRegister')}</Link>
        </p>
      </div>
    </div>
  );
}
