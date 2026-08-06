import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/i18n';

export function ResetPasswordPage() {
  const { lang } = useI18n();
  const { configured, loading, user, role, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(lang === 'he' ? 'הסיסמה חייבת להכיל לפחות 8 תווים.' : 'Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'he' ? 'הסיסמאות אינן זהות.' : 'Passwords do not match.');
      return;
    }

    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B29259] border-t-transparent" role="status" aria-label={lang === 'he' ? 'טוען' : 'Loading'} />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700" role="alert">
          {lang === 'he' ? 'מערכת ההתחברות אינה פעילה כרגע.' : 'Authentication is not currently available.'}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-[#8C6D3F]">
            {lang === 'he' ? 'קישור האיפוס אינו תקף' : 'Reset link is invalid'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {lang === 'he'
              ? 'ייתכן שהקישור פג תוקף או שכבר נעשה בו שימוש. בקשו קישור חדש ממסך ההתחברות.'
              : 'The link may have expired or already been used. Request a new one from the login page.'}
          </p>
          <Link to="/login" state={{ from: '/admin' }} className="mt-5 inline-flex rounded-xl bg-[#B29259] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8C6D3F]">
            {lang === 'he' ? 'חזרה להתחברות' : 'Back to login'}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm" role="status">
          <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-[#8C6D3F]">
            {lang === 'he' ? 'הסיסמה עודכנה בהצלחה' : 'Password updated successfully'}
          </h2>
          <button
            type="button"
            onClick={() => navigate(role === 'admin' ? '/admin' : '/account', { replace: true })}
            className="mt-5 w-full rounded-xl bg-[#B29259] py-2.5 text-sm font-bold text-white hover:bg-[#8C6D3F]"
          >
            {role === 'admin'
              ? lang === 'he' ? 'כניסה לניהול' : 'Open management'
              : lang === 'he' ? 'כניסה לאזור האישי' : 'Open account'}
          </button>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-[#FAF7F2] py-2.5 ps-9 pe-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]';

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#8C6D3F]">
          <KeyRound className="h-5 w-5 text-[#B29259]" aria-hidden="true" />
          {lang === 'he' ? 'הגדרת סיסמה חדשה' : 'Choose a new password'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {lang === 'he' ? 'בחרו סיסמה חדשה וחזקה לחשבון המנהלת.' : 'Choose a new secure password for the manager account.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-gray-700">
              {lang === 'he' ? 'סיסמה חדשה' : 'New password'}
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input id="new-password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} dir="ltr" autoComplete="new-password" />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold text-gray-700">
              {lang === 'he' ? 'אימות סיסמה חדשה' : 'Confirm new password'}
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input id="confirm-password" type="password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} dir="ltr" autoComplete="new-password" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#B29259] py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#8C6D3F] disabled:opacity-60">
            {busy
              ? lang === 'he' ? 'מעדכן...' : 'Updating...'
              : lang === 'he' ? 'שמירת הסיסמה החדשה' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
