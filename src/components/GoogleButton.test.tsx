import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { GoogleButton, OrDivider } from './GoogleButton';

const a = vi.hoisted(() => ({
  configured: true,
  google: vi.fn(async () => ({ error: null as string | null }))
}));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ signInWithGoogle: a.google, configured: a.configured })
}));

const renderBtn = (onError?: (m: string) => void) =>
  render(
    <I18nProvider>
      <GoogleButton onError={onError} />
    </I18nProvider>
  );

beforeEach(() => {
  a.configured = true;
  a.google.mockClear().mockResolvedValue({ error: null });
});

describe('GoogleButton', () => {
  it('calls signInWithGoogle on click', async () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(a.google).toHaveBeenCalled());
  });

  it('reports an error from the provider', async () => {
    a.google.mockResolvedValueOnce({ error: 'popup closed' });
    const onError = vi.fn();
    renderBtn(onError);
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('popup closed'));
  });

  it('short-circuits with a notice when not configured', () => {
    a.configured = false;
    const onError = vi.fn();
    renderBtn(onError);
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    expect(a.google).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/.+/));
  });

  it('does not throw when no onError handler is supplied', () => {
    a.configured = false;
    renderBtn();
    expect(() => fireEvent.click(screen.getByRole('button', { name: /Google/ }))).not.toThrow();
  });

  it('OrDivider renders the "or" separator', () => {
    render(<I18nProvider><OrDivider /></I18nProvider>);
    expect(screen.getByText('או')).toBeInTheDocument();
  });
});
