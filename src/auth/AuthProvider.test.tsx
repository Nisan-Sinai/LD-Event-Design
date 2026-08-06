import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

const mock = vi.hoisted(() => ({
  configured: true,
  session: null as unknown,
  signUp: vi.fn(async () => ({ error: null as { message: string } | null })),
  signIn: vi.fn(async () => ({ error: null as { message: string } | null })),
  googleOAuth: vi.fn(async () => ({ error: null as { message: string } | null })),
  resetPassword: vi.fn(async () => ({ error: null as { message: string } | null })),
  updateUser: vi.fn(async () => ({ error: null as { message: string } | null })),
  signOut: vi.fn(async () => ({})),
  rpc: vi.fn(async () => ({ data: 0, error: null })),
  authCb: null as null | ((event: string, session: unknown) => void)
}));

vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mock.configured;
  },
  supabase: {
    rpc: mock.rpc,
    auth: {
      getSession: async () => ({ data: { session: mock.session } }),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mock.authCb = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signUp: mock.signUp,
      signInWithPassword: mock.signIn,
      signInWithOAuth: mock.googleOAuth,
      resetPasswordForEmail: mock.resetPassword,
      updateUser: mock.updateUser,
      signOut: mock.signOut
    }
  }
}));

function Probe() {
  const {
    user,
    role,
    loading,
    configured,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut
  } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="role">{role}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="configured">{String(configured)}</span>
      <button onClick={() => void signUp('a@b.com', 'pw')}>signup</button>
      <button onClick={() => void signIn('a@b.com', 'pw')}>signin</button>
      <button onClick={() => void signInWithGoogle('/admin')}>google</button>
      <button onClick={() => void signInWithGoogle('//evil.example')}>unsafe-google</button>
      <button onClick={() => void resetPassword('a@b.com')}>reset</button>
      <button onClick={() => void updatePassword('new-password')}>update</button>
      <button onClick={() => void signOut()}>signout</button>
    </div>
  );
}

const renderAuth = () => render(<AuthProvider><Probe /></AuthProvider>);

beforeEach(() => {
  mock.configured = true;
  mock.session = null;
  mock.signUp.mockClear().mockResolvedValue({ error: null });
  mock.signIn.mockClear().mockResolvedValue({ error: null });
  mock.googleOAuth.mockClear().mockResolvedValue({ error: null });
  mock.resetPassword.mockClear().mockResolvedValue({ error: null });
  mock.updateUser.mockClear().mockResolvedValue({ error: null });
  mock.signOut.mockClear();
  mock.rpc.mockClear().mockResolvedValue({ data: 0, error: null });
  mock.authCb = null;
});

describe('AuthProvider — not configured', () => {
  it('stops loading, stays guest, and short-circuits auth calls', async () => {
    mock.configured = false;
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('role').textContent).toBe('guest');
    expect(screen.getByTestId('configured').textContent).toBe('false');
    screen.getByText('signup').click();
    screen.getByText('signin').click();
    screen.getByText('google').click();
    screen.getByText('reset').click();
    screen.getByText('update').click();
    screen.getByText('signout').click();
    expect(mock.signUp).not.toHaveBeenCalled();
    expect(mock.signIn).not.toHaveBeenCalled();
    expect(mock.googleOAuth).not.toHaveBeenCalled();
    expect(mock.resetPassword).not.toHaveBeenCalled();
    expect(mock.updateUser).not.toHaveBeenCalled();
    expect(mock.signOut).not.toHaveBeenCalled();
  });
});

describe('AuthProvider — configured', () => {
  it('loads an admin session and derives the admin role', async () => {
    mock.session = { user: { id: '1', email: 'luroni704@gmail.com' } };
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('admin'));
    expect(screen.getByTestId('email').textContent).toBe('luroni704@gmail.com');
  });

  it('a non-admin email becomes a customer', async () => {
    mock.session = { user: { id: '2', email: 'other@x.com' } };
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('customer'));
  });

  it('reacts to auth state changes and claims guest orders on sign-in', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('guest'));
    act(() => mock.authCb?.('SIGNED_IN', { user: { id: '9', email: 'other@x.com' } }));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('customer'));
    expect(mock.rpc).toHaveBeenCalledWith('claim_my_orders');
  });

  it('does not claim orders on non-sign-in events', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    act(() => mock.authCb?.('SIGNED_OUT', null));
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it('uses the current origin and requested route for Google OAuth', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('google').click());
    expect(mock.googleOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      }
    });
  });

  it('rejects external OAuth return paths and falls back to the app root', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('unsafe-google').click());
    expect(mock.googleOAuth).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ redirectTo: `${window.location.origin}/` })
    }));
  });

  it('forwards signUp, signIn, signOut, reset and update actions to Supabase', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('signup').click());
    await act(async () => screen.getByText('signin').click());
    await act(async () => screen.getByText('reset').click());
    await act(async () => screen.getByText('update').click());
    await act(async () => screen.getByText('signout').click());
    expect(mock.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
    expect(mock.signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
    expect(mock.resetPassword).toHaveBeenCalledWith('a@b.com', {
      redirectTo: `${window.location.origin}/reset-password`
    });
    expect(mock.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(mock.signOut).toHaveBeenCalled();
  });

  it('surfaces provider error messages', async () => {
    mock.signUp.mockResolvedValueOnce({ error: { message: 'taken' } });
    mock.googleOAuth.mockResolvedValueOnce({ error: { message: 'google disabled' } });
    mock.resetPassword.mockResolvedValueOnce({ error: { message: 'rate limited' } });
    mock.updateUser.mockResolvedValueOnce({ error: { message: 'weak password' } });
    const results: string[] = [];

    function Catcher() {
      const { signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();
      return (
        <div>
          <button onClick={async () => results.push((await signUp('a@b.com', 'pw')).error ?? '')}>catch-signup</button>
          <button onClick={async () => results.push((await signInWithGoogle()).error ?? '')}>catch-google</button>
          <button onClick={async () => results.push((await resetPassword('a@b.com')).error ?? '')}>catch-reset</button>
          <button onClick={async () => results.push((await updatePassword('password')).error ?? '')}>catch-update</button>
        </div>
      );
    }

    render(<AuthProvider><Catcher /></AuthProvider>);
    await act(async () => screen.getByText('catch-signup').click());
    await act(async () => screen.getByText('catch-google').click());
    await act(async () => screen.getByText('catch-reset').click());
    await act(async () => screen.getByText('catch-update').click());
    expect(results).toEqual(['taken', 'google disabled', 'rate limited', 'weak password']);
  });
});

describe('useAuth', () => {
  it('throws when used outside the provider', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    silence.mockRestore();
  });
});
