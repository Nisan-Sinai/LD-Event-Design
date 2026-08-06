import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { LoginPage } from './LoginPage';

const a = vi.hoisted(() => ({
  configured: true,
  signIn: vi.fn(async () => ({ error: null as string | null })),
  resetPassword: vi.fn(async () => ({ error: null as string | null })),
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: a.signIn,
    resetPassword: a.resetPassword,
    signInWithGoogle: a.google,
    configured: a.configured
  })
}));

function renderLogin(initial: string | { pathname: string; state?: { from?: string } } = '/login') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/order" element={<div>ORDER PAGE</div>} />
          <Route path="/account" element={<div>ACCOUNT PAGE</div>} />
          <Route path="/admin" element={<div>ADMIN PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

beforeEach(() => {
  a.configured = true;
  a.signIn.mockClear().mockResolvedValue({ error: null });
  a.resetPassword.mockClear().mockResolvedValue({ error: null });
  a.google.mockClear().mockResolvedValue({ error: null });
});

describe('LoginPage', () => {
  it('renders the login form and a prominent forgot-password action', () => {
    renderLogin();
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
    expect(screen.getByText('לא זוכרים את הסיסמה?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שכחתי סיסמה — שלחו לי קישור איפוס' })).toBeInTheDocument();
  });

  it('offers Google sign-in and returns manager login to admin', async () => {
    renderLogin({ pathname: '/login', state: { from: '/admin' } });
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalledWith('/admin'));
  });

  it('shows a not-configured notice and blocks submit', () => {
    a.configured = false;
    renderLogin();
    expect(screen.getAllByText(/לא הופעלה/).length).toBeGreaterThan(0);
    fireEvent.submit(screen.getByLabelText('אימייל').closest('form')!);
    expect(a.signIn).not.toHaveBeenCalled();
  });

  it('navigates to /order on successful login', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ORDER PAGE')).toBeInTheDocument());
    expect(a.signIn).toHaveBeenCalledWith('a@b.com', 'secret');
  });

  it('shows the error returned by signIn', async () => {
    a.signIn.mockResolvedValueOnce({ error: 'Invalid login credentials' });
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
  });

  it('returns to the page the user came from', async () => {
    renderLogin({ pathname: '/login', state: { from: '/account' } });
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ACCOUNT PAGE')).toBeInTheDocument());
  });

  it('sends a password reset email and shows confirmation', async () => {
    renderLogin({ pathname: '/login', state: { from: '/admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'שכחתי סיסמה — שלחו לי קישור איפוס' }));
    expect(screen.queryByLabelText('סיסמה')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: ' luroni704@gmail.com ' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת קישור איפוס' }));
    await waitFor(() => expect(a.resetPassword).toHaveBeenCalledWith('luroni704@gmail.com'));
    expect(screen.getByRole('status')).toHaveTextContent(/שלחנו קישור/);
  });

  it('shows reset errors and can return to login', async () => {
    a.resetPassword.mockResolvedValueOnce({ error: 'email rate limit exceeded' });
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'שכחתי סיסמה — שלחו לי קישור איפוס' }));
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת קישור איפוס' }));
    await waitFor(() => expect(screen.getByText('email rate limit exceeded')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'חזרה להתחברות' }));
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
  });

  it('blocks password reset when Supabase is not configured', () => {
    a.configured = false;
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'שכחתי סיסמה — שלחו לי קישור איפוס' }));
    fireEvent.submit(screen.getByLabelText('אימייל').closest('form')!);
    expect(a.resetPassword).not.toHaveBeenCalled();
  });
});
