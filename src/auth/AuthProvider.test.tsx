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
  rpc: vi.fn(async (fn: string) => rpcDefault(fn)),
  authCb: null as null | ((event: string, session: unknown) => void)
}));

// is_admin מחזיר boolean; claim_my_orders מחזיר מונה. ברירת המחדל: לא מנהל.
function rpcDefault(fn: string): { data: unknown; error: unknown } {
  return fn === 'is_admin' ? { data: false, error: null } : { data: 0, error: null };
}

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
    roleLoading,
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
      <span data-testid="role-loading">{String(roleLoading)}</span>
      <span data-testid="role">{role}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="configured">{String(configured)}</span>
      <button onClick={() => void signUp('a@b.com', 'StrongPassword12')}>signup</button>
      <button onClick={() => void signIn('a@b.com', 'pw')}>signin</button>
      <button onClick={() => void signInWithGoogle('/admin')}>google</button>
      <button onClick={() => void signInWithGoogle('//evil.example')}>unsafe-google</button>
      <button onClick={() => void resetPassword('a@b.com')}>reset</button>
      <button onClick={() => void updatePassword('NewPassword12')}>update</button>
      <button onClick={() => void signOut()}>signout</button>
    </div>
  );
}

const renderAuth = () => render(<AuthProvider><Probe /></AuthProvider>);

beforeEach(() => {
  window.sessionStorage.clear();
  mock.configured = true;
  mock.session = null;
  mock.signUp.mockClear().mockResolvedValue({ error: null });
  mock.signIn.mockClear().mockResolvedValue({ error: null });
  mock.googleOAuth.mockClear().mockResolvedValue({ error: null });
  mock.resetPassword.mockClear().mockResolvedValue({ error: null });
  mock.updateUser.mockClear().mockResolvedValue({ error: null });
  mock.signOut.mockClear();
  mock.rpc.mockClear().mockImplementation(async (fn: string) => rpcDefault(fn));
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
  it('promotes to admin only when the server is_admin RPC says so', async () => {
    mock.session = { user: { id: '1', email: 'admin@example.com' } };
    mock.rpc.mockImplementation(async (fn: string) =>
      fn === 'is_admin' ? { data: true, error: null } : { data: 0, error: null }
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('admin'));
    expect(mock.rpc).toHaveBeenCalledWith('is_admin');
    expect(screen.getByTestId('role-loading').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('admin@example.com');
  });

  it('stays a customer when the server says the user is not an admin', async () => {
    mock.session = { user: { id: '2', email: 'customer@example.com' } };
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role-loading').textContent).toBe('false'));
    expect(screen.getByTestId('role').textContent).toBe('customer');
  });

  it('never grants admin while the role check is still in flight', async () => {
    mock.session = { user: { id: '3', email: 'admin@example.com' } };
    let release: (value: { data: unknown; error: unknown }) => void = () => {};
    mock.rpc.mockImplementation((fn: string) =>
      fn === 'is_admin'
        ? new Promise((resolve) => {
            release = resolve;
          })
        : Promise.resolve({ data: 0, error: null })
    );
    renderAuth();
    // התשובה עוד לא חזרה: התפקיד הבטוח הוא customer והדגל עדיין דלוק.
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('role').textContent).toBe('customer');
    expect(screen.getByTestId('role-loading').textContent).toBe('true');
    await act(async () => release({ data: true, error: null }));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('admin'));
  });

  it('falls back to customer when the is_admin RPC returns an error', async () => {
    mock.session = { user: { id: '4', email: 'admin@example.com' } };
    mock.rpc.mockImplementation(async (fn: string) =>
      fn === 'is_admin' ? { data: null, error: { message: 'permission denied' } } : { data: 0, error: null }
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role-loading').textContent).toBe('false'));
    expect(screen.getByTestId('role').textContent).toBe('customer');
  });

  it('falls back to customer when the is_admin RPC rejects', async () => {
    mock.session = { user: { id: '5', email: 'admin@example.com' } };
    mock.rpc.mockImplementation((fn: string) =>
      fn === 'is_admin' ? Promise.reject(new Error('network down')) : Promise.resolve({ data: 0, error: null })
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role-loading').textContent).toBe('false'));
    expect(screen.getByTestId('role').textContent).toBe('customer');
  });

  it('ignores a stale is_admin answer that a newer sign-in has superseded', async () => {
    const resolvers: Array<(value: { data: unknown; error: unknown }) => void> = [];
    mock.rpc.mockImplementation((fn: string) =>
      fn === 'is_admin'
        ? new Promise((resolve) => {
            resolvers.push(resolve);
          })
        : Promise.resolve({ data: 0, error: null })
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    act(() => mock.authCb?.('SIGNED_IN', { user: { id: '6', email: 'admin@example.com' } }));
    act(() => mock.authCb?.('SIGNED_IN', { user: { id: '7', email: 'customer@example.com' } }));
    await waitFor(() => expect(resolvers.length).toBe(2));
    // התשובה הישנה ('admin') חוזרת אחרונה ואסור לה לדרוס את החדשה.
    await act(async () => {
      resolvers[1]({ data: false, error: null });
      resolvers[0]({ data: true, error: null });
    });
    expect(screen.getByTestId('role').textContent).toBe('customer');
  });

  it('reacts to auth state changes and claims guest orders on sign-in', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('guest'));
    act(() => mock.authCb?.('SIGNED_IN', { user: { id: '9', email: 'customer@example.com' } }));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('customer'));
    expect(mock.rpc).toHaveBeenCalledWith('claim_my_orders');
  });

  it('re-checks the role on every auth state change, not just the first load', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('guest'));
    mock.rpc.mockImplementation(async (fn: string) =>
      fn === 'is_admin' ? { data: true, error: null } : { data: 0, error: null }
    );
    act(() => mock.authCb?.('TOKEN_REFRESHED', { user: { id: '8', email: 'admin@example.com' } }));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('admin'));
  });

  it('drops back to guest and stops the role check on sign-out', async () => {
    mock.session = { user: { id: '2', email: 'customer@example.com' } };
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('customer'));
    act(() => mock.authCb?.('SIGNED_OUT', null));
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('guest'));
    expect(screen.getByTestId('role-loading').textContent).toBe('false');
  });

  it('does not claim orders on non-sign-in events', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    act(() => mock.authCb?.('SIGNED_OUT', null));
    expect(mock.rpc).not.toHaveBeenCalledWith('claim_my_orders');
  });

  it('uses the current deployment origin and a login callback for Google OAuth', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('google').click());
    expect(mock.googleOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login?from=%2Fadmin`,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      }
    });
    expect(window.sessionStorage.getItem('ld-event-design-auth-return')).toBe('/admin');
  });

  it('rejects external OAuth return paths and falls back to admin', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('unsafe-google').click());
    expect(mock.googleOAuth).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        redirectTo: `${window.location.origin}/login?from=%2Fadmin`
      })
    }));
  });

  it('blocks weak passwords before they reach Supabase', async () => {
    const results: string[] = [];
    function WeakPasswordProbe() {
      const { signUp, updatePassword } = useAuth();
      return (
        <div>
          <button onClick={async () => results.push((await signUp('a@b.com', 'short')).error ?? '')}>weak-signup</button>
          <button onClick={async () => results.push((await updatePassword('short')).error ?? '')}>weak-update</button>
        </div>
      );
    }
    render(<AuthProvider><WeakPasswordProbe /></AuthProvider>);
    await act(async () => screen.getByText('weak-signup').click());
    await act(async () => screen.getByText('weak-update').click());
    expect(results).toEqual([
      'Password must contain at least 12 characters',
      'Password must contain at least 12 characters'
    ]);
    expect(mock.signUp).not.toHaveBeenCalled();
    expect(mock.updateUser).not.toHaveBeenCalled();
  });

  it('forwards signUp, signIn, signOut, reset and update actions to Supabase', async () => {
    window.sessionStorage.setItem('ld-event-design-auth-return', '/admin');
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('signup').click());
    await act(async () => screen.getByText('signin').click());
    await act(async () => screen.getByText('reset').click());
    await act(async () => screen.getByText('update').click());
    await act(async () => screen.getByText('signout').click());
    expect(mock.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'StrongPassword12',
      options: { emailRedirectTo: `${window.location.origin}/login` }
    });
    expect(mock.signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
    expect(mock.resetPassword).toHaveBeenCalledWith('a@b.com', {
      redirectTo: `${window.location.origin}/reset-password`
    });
    expect(mock.updateUser).toHaveBeenCalledWith({ password: 'NewPassword12' });
    expect(mock.signOut).toHaveBeenCalled();
    expect(window.sessionStorage.getItem('ld-event-design-auth-return')).toBeNull();
  });

  it('surfaces provider error messages for strong-password operations', async () => {
    mock.signUp.mockResolvedValueOnce({ error: { message: 'taken' } });
    mock.googleOAuth.mockResolvedValueOnce({ error: { message: 'google disabled' } });
    mock.resetPassword.mockResolvedValueOnce({ error: { message: 'rate limited' } });
    mock.updateUser.mockResolvedValueOnce({ error: { message: 'weak password' } });
    const results: string[] = [];

    function Catcher() {
      const { signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();
      return (
        <div>
          <button onClick={async () => results.push((await signUp('a@b.com', 'StrongPassword12')).error ?? '')}>catch-signup</button>
          <button onClick={async () => results.push((await signInWithGoogle()).error ?? '')}>catch-google</button>
          <button onClick={async () => results.push((await resetPassword('a@b.com')).error ?? '')}>catch-reset</button>
          <button onClick={async () => results.push((await updatePassword('AnotherPassword12')).error ?? '')}>catch-update</button>
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
