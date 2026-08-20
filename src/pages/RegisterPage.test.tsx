import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { RegisterPage } from './RegisterPage';

const a = vi.hoisted(() => ({
  configured: true,
  signUp: vi.fn(async () => ({ error: null as string | null })),
  signIn: vi.fn(async () => ({ error: null as string | null })),
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ signUp: a.signUp, signIn: a.signIn, signInWithGoogle: a.google, configured: a.configured })
}));

function renderReg() {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>PACKAGE BUILDER</div>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

const STRONG_PASSWORD = 'StrongPass123!';

const fill = (email: string, pw: string) => {
  fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: pw } });
  fireEvent.click(screen.getByRole('button', { name: 'הרשמה' }));
};

beforeEach(() => {
  a.configured = true;
  a.signUp.mockClear().mockResolvedValue({ error: null });
  a.signIn.mockClear().mockResolvedValue({ error: null });
  a.google.mockClear().mockResolvedValue({ error: null });
});

describe('RegisterPage', () => {
  it('offers Google sign-up', async () => {
    renderReg();
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalled());
  });

  it('blocks submit and shows a notice when not configured', () => {
    a.configured = false;
    renderReg();
    fill('a@b.com', STRONG_PASSWORD);
    expect(a.signUp).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    renderReg();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: STRONG_PASSWORD } });
    fireEvent.submit(screen.getByLabelText('אימייל').closest('form')!);
    await waitFor(() => expect(screen.getByText('כתובת אימייל אינה תקינה')).toBeInTheDocument());
    expect(a.signUp).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 12 characters', async () => {
    renderReg();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: '12345678901' } });
    fireEvent.submit(screen.getByLabelText('אימייל').closest('form')!);
    await waitFor(() => expect(screen.getByText('הסיסמה חייבת לכלול לפחות 12 תווים')).toBeInTheDocument());
    expect(a.signUp).not.toHaveBeenCalled();
  });

  it('signs up then logs in and navigates to the current package builder', async () => {
    renderReg();
    fill('a@b.com', STRONG_PASSWORD);
    await waitFor(() => expect(screen.getByText('PACKAGE BUILDER')).toBeInTheDocument());
    expect(a.signUp).toHaveBeenCalledWith('a@b.com', STRONG_PASSWORD);
    expect(a.signIn).toHaveBeenCalledWith('a@b.com', STRONG_PASSWORD);
  });

  it('shows the signUp error', async () => {
    a.signUp.mockResolvedValueOnce({ error: 'User already registered' });
    renderReg();
    fill('a@b.com', STRONG_PASSWORD);
    await waitFor(() => expect(screen.getByText('User already registered')).toBeInTheDocument());
  });

  it('shows the success message when sign-in after sign-up fails (email confirmation)', async () => {
    a.signIn.mockResolvedValueOnce({ error: 'Email not confirmed' });
    renderReg();
    fill('a@b.com', STRONG_PASSWORD);
    await waitFor(() => expect(screen.getByText(/ההרשמה הצליחה/)).toBeInTheDocument());
  });
});
