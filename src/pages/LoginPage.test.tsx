import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { LoginPage } from './LoginPage';

const a = vi.hoisted(() => ({
  configured: true,
  user: null as { email?: string } | null,
  role: 'guest' as 'guest' | 'customer' | 'admin',
  signIn: vi.fn(async () => ({ error: null as string | null })),
  resetPassword: vi.fn(async () => ({ error: null as string | null })),
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: a.user,
    role: a.role,
    signIn: a.signIn,
    resetPassword: a.resetPassword,
    signInWithGoogle: a.google,
    configured: a.configured
  })
}));

function renderLogin(initial: string | { pathname: string; search?: string; state?: { from?: string } } = '/login') {
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
  window.sessionStorage.clear();
  a.configured = true;
  a.user = null;
  a.role = 'guest';
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
    renderLogin('/login?from=%2Fadmin');
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalledWith('/admin'));
    expect(window.sessionStorage.getItem('ld-event-design-auth-return')).toBe('/admin');
  });

  it('shows a not-configured notice and blocks submit', () => {
    a.configured = false;
    renderLogin();
    expect(screen.getAllByText(/לא הופעלה/).length).toBeGreaterThan(0);
    fireEvent.submit(screen.getByLabelText('אימייל').closest('form')!);
    expect(a.signIn).not.toHaveBeenCalled();
  });

  it('navigates to admin by default instead of the order-details form', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ADMIN PAGE')).toBeInTheDocument());
    expect(screen.queryByText('ORDER PAGE')).not.toBeInTheDocument();
    expect(a.signIn).toHaveBeenCalledWith('a@b.com', 'secret');
  });

  it('uses a safe query return path from a direct login URL', async () => {
    renderLogin('/login?from=%2Faccount');
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ACCOUNT PAGE')).toBeInTheDocument());
  });

  it('rejects an external return URL and falls back to admin', async () => {
    renderLogin('/login?from=https%3A%2F%2Fevil.example');
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ADMIN PAGE')).toBeInTheDocument());
  });

  it('automatically forwards an authenticated manager to admin', async () => {
    a.user = { email: 'nisan.sinai5@gmail.com' };
    a.role = 'admin';
    renderLogin('/login?from=%2Fadmin');
    await waitFor(() => expect(screen.getByText('ADMIN PAGE')).toBeInTheDocument());
  });

  it('shows the error returned by signIn', async () => {
    a.signIn.mockResolvedValueOnce({ error: 'Invalid login credentials' });
    renderLogin();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
  });

  it('returns to the page supplied through router state', async () => {
    renderLogin({ pathname: '/login', state: { from: '/account' } });
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ACCOUNT PAGE')).toBeInTheDocument());
  });

  it('sends a password reset email and shows confirmation', async () => {
    renderLogin('/login?from=%2Fadmin');
    fireEvent.click(screen.getByRole('button', { name: 'שכחתי סיסמה — שלחו לי קישור איפוס' }));
    expect(screen.queryByLabelText('סיסמה')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: ' nisan.sinai5@gmail.com ' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת קישור איפוס' }));
    await waitFor(() => expect(a.resetPassword).toHaveBeenCalledWith('nisan.sinai5@gmail.com'));
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
