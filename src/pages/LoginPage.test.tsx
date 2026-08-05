import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { LoginPage } from './LoginPage';

const a = vi.hoisted(() => ({
  configured: true,
  signIn: vi.fn(async () => ({ error: null as string | null })),
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ signIn: a.signIn, signInWithGoogle: a.google, configured: a.configured })
}));

function renderLogin(initial = '/login') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/order" element={<div>ORDER PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

beforeEach(() => {
  a.configured = true;
  a.signIn.mockClear().mockResolvedValue({ error: null });
  a.google.mockClear().mockResolvedValue({ error: null });
});

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
  });

  it('offers Google sign-in', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalled());
  });

  it('shows a not-configured notice and blocks submit', async () => {
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
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/account' } }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<div>ACCOUNT PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    );
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('ACCOUNT PAGE')).toBeInTheDocument());
  });
});
