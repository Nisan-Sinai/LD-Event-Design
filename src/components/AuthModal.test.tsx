import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { AuthModal } from './AuthModal';

const a = vi.hoisted(() => ({
  configured: true,
  signUp: vi.fn(async () => ({ error: null as string | null })),
  signIn: vi.fn(async () => ({ error: null as string | null })),
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ signUp: a.signUp, signIn: a.signIn, signInWithGoogle: a.google, configured: a.configured })
}));

function renderModal(props: Partial<{ open: boolean; onClose: () => void; onSuccess: () => void }> = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onSuccess = props.onSuccess ?? vi.fn();
  render(
    <I18nProvider>
      <AuthModal open={props.open ?? true} onClose={onClose} onSuccess={onSuccess} />
    </I18nProvider>
  );
  return { onClose, onSuccess };
}

const STRONG_PASSWORD = 'StrongPass123!';

const fill = (email: string, pw: string) => {
  fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: pw } });
};

beforeEach(() => {
  a.configured = true;
  a.signUp.mockClear().mockResolvedValue({ error: null });
  a.signIn.mockClear().mockResolvedValue({ error: null });
  a.google.mockClear().mockResolvedValue({ error: null });
});

describe('AuthModal', () => {
  it('continues with Google (and blocks when not configured)', async () => {
    const { rerender } = render(
      <I18nProvider><AuthModal open onClose={vi.fn()} onSuccess={vi.fn()} /></I18nProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /המשך עם Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalled());
    a.google.mockClear();
    a.configured = false;
    rerender(<I18nProvider><AuthModal open onClose={vi.fn()} onSuccess={vi.fn()} /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: /המשך עם Google/ }));
    expect(a.google).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the quick sign-up tab', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /הרשמה מהירה/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('blocks submit when not configured', () => {
    a.configured = false;
    renderModal();
    fill('a@b.com', STRONG_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: 'הרשמה' }));
    expect(a.signUp).not.toHaveBeenCalled();
  });

  it('validates email and the 12-character registration policy', async () => {
    renderModal();
    const form = screen.getByLabelText('אימייל').closest('form')!;
    fill('bad', STRONG_PASSWORD);
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText('כתובת אימייל אינה תקינה')).toBeInTheDocument());
    fill('a@b.com', '12345678901');
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText('הסיסמה חייבת לכלול לפחות 12 תווים')).toBeInTheDocument());
  });

  it('registers (signUp + signIn) and calls onSuccess', async () => {
    const { onSuccess } = renderModal();
    fill('a@b.com', STRONG_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: 'הרשמה' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(a.signUp).toHaveBeenCalledWith('a@b.com', STRONG_PASSWORD);
    expect(a.signIn).toHaveBeenCalledWith('a@b.com', STRONG_PASSWORD);
  });

  it('switches back to the register tab', () => {
    renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /התחברות/ }));
    expect(screen.getByRole('tab', { name: /התחברות/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /הרשמה מהירה/ }));
    expect(screen.getByRole('tab', { name: /הרשמה מהירה/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('login tab only signs in and still accepts existing shorter passwords', async () => {
    const { onSuccess } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /התחברות/ }));
    fill('a@b.com', '123456');
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(a.signUp).not.toHaveBeenCalled();
    expect(a.signIn).toHaveBeenCalledWith('a@b.com', '123456');
  });

  it('shows an auth error and does not call onSuccess', async () => {
    a.signIn.mockResolvedValue({ error: 'Invalid login credentials' });
    const { onSuccess } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /התחברות/ }));
    fill('a@b.com', '123456');
    fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));
    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('closes on Escape, backdrop click, and the X button', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
