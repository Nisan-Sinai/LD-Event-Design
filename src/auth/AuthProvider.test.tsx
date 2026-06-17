import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';

const mock = vi.hoisted(() => ({
  configured: true,
  session: null as unknown,
  signUp: vi.fn(async () => ({ error: null as { message: string } | null })),
  signIn: vi.fn(async () => ({ error: null as { message: string } | null })),
  googleOAuth: vi.fn(async () => ({ error: null as { message: string } | null })),
  signOut: vi.fn(async () => ({})),
  rpc: vi.fn(async () => ({ data: 0, error: null })),
  authCb: null as null | ((e: string, s: unknown) => void)
}));

vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mock.configured;
  },
  supabase: {
    rpc: mock.rpc,
    auth: {
      getSession: async () => ({ data: { session: mock.session } }),
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        mock.authCb = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signUp: mock.signUp,
      signInWithPassword: mock.signIn,
      signInWithOAuth: mock.googleOAuth,
      signOut: mock.signOut
    }
  }
}));

function Probe() {
  const { user, role, loading, configured, signUp, signIn, signInWithGoogle, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="role">{role}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="configured">{String(configured)}</span>
      <button onClick={() => void signUp('a@b.com', 'pw')}>signup</button>
      <button onClick={() => void signIn('a@b.com', 'pw')}>signin</button>
      <button onClick={() => void signInWithGoogle()}>google</button>
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
    screen.getByText('signout').click();
    expect(mock.signUp).not.toHaveBeenCalled();
    expect(mock.signIn).not.toHaveBeenCalled();
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

  it('signs in with Google (and short-circuits when not configured)', async () => {
    mock.configured = false;
    const { unmount } = renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('google').click());
    expect(mock.googleOAuth).not.toHaveBeenCalled();
    unmount();
    mock.configured = true;
    renderAuth();
    await act(async () => screen.getByText('google').click());
    expect(mock.googleOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
  });

  it('forwards signUp / signIn / signOut to supabase', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => screen.getByText('signup').click());
    await act(async () => screen.getByText('signin').click());
    await act(async () => screen.getByText('signout').click());
    expect(mock.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
    expect(mock.signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
    expect(mock.signOut).toHaveBeenCalled();
  });

  it('surfaces a signUp error message', async () => {
    mock.signUp.mockResolvedValueOnce({ error: { message: 'taken' } });
    let result: { error: string | null } = { error: null };
    function Catcher() {
      const { signUp } = useAuth();
      return <button onClick={async () => { result = await signUp('a@b.com', 'pw'); }}>go</button>;
    }
    render(<AuthProvider><Catcher /></AuthProvider>);
    await act(async () => screen.getByText('go').click());
    expect(result.error).toBe('taken');
  });
});

describe('useAuth', () => {
  it('throws when used outside the provider', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    silence.mockRestore();
  });
});
