import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { ResetPasswordPage } from './ResetPasswordPage';

const auth = vi.hoisted(() => ({
  configured: true,
  loading: false,
  user: { email: 'luroni704@gmail.com' } as { email?: string } | null,
  role: 'admin' as 'admin' | 'customer',
  updatePassword: vi.fn(async () => ({ error: null as string | null }))
}));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => auth
}));

function renderPage() {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<div>ADMIN PAGE</div>} />
          <Route path="/account" element={<div>ACCOUNT PAGE</div>} />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

beforeEach(() => {
  auth.configured = true;
  auth.loading = false;
  auth.user = { email: 'luroni704@gmail.com' };
  auth.role = 'admin';
  auth.updatePassword.mockClear().mockResolvedValue({ error: null });
});

describe('ResetPasswordPage', () => {
  it('shows a loading indicator while the recovery session is being read', () => {
    auth.loading = true;
    renderPage();
    expect(screen.getByRole('status', { name: 'טוען' })).toBeInTheDocument();
  });

  it('shows a configuration error when Supabase is unavailable', () => {
    auth.configured = false;
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent(/אינה פעילה/);
  });

  it('shows an expired-link message when there is no recovery user', () => {
    auth.user = null;
    renderPage();
    expect(screen.getByRole('heading', { name: 'קישור האיפוס אינו תקף' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'חזרה להתחברות' })).toHaveAttribute('href', '/login');
  });

  it('requires at least eight characters', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), { target: { value: 'short' } });
    fireEvent.submit(screen.getByLabelText('סיסמה חדשה').closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent(/לפחות 8/);
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects mismatching passwords', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), { target: { value: 'password-2' } });
    fireEvent.submit(screen.getByLabelText('סיסמה חדשה').closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent(/אינן זהות/);
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('shows an update error returned by Supabase', async () => {
    auth.updatePassword.mockResolvedValueOnce({ error: 'weak password' });
    renderPage();
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.submit(screen.getByLabelText('סיסמה חדשה').closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('weak password'));
  });

  it('updates an admin password and opens management', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.submit(screen.getByLabelText('סיסמה חדשה').closest('form')!);
    await waitFor(() => expect(screen.getByText('הסיסמה עודכנה בהצלחה')).toBeInTheDocument());
    expect(auth.updatePassword).toHaveBeenCalledWith('password-1');
    fireEvent.click(screen.getByRole('button', { name: 'כניסה לניהול' }));
    expect(screen.getByText('ADMIN PAGE')).toBeInTheDocument();
  });

  it('returns a customer to the account page after success', async () => {
    auth.role = 'customer';
    renderPage();
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), { target: { value: 'password-1' } });
    fireEvent.submit(screen.getByLabelText('סיסמה חדשה').closest('form')!);
    await waitFor(() => expect(screen.getByRole('button', { name: 'כניסה לאזור האישי' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'כניסה לאזור האישי' }));
    expect(screen.getByText('ACCOUNT PAGE')).toBeInTheDocument();
  });
});
