import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  resolveSession: null as null | ((value: { data: { session: null } }) => void),
  unsubscribe: vi.fn(),
  rpc: vi.fn()
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: state.rpc,
    auth: {
      getSession: () => new Promise<{ data: { session: null } }>((resolve) => {
        state.resolveSession = resolve;
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: state.unsubscribe } } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

import { AuthProvider } from './AuthProvider';

describe('AuthProvider bootstrap lifecycle', () => {
  it('ignores a late getSession result after unmount and unsubscribes', async () => {
    state.resolveSession = null;
    state.unsubscribe.mockClear();
    state.rpc.mockClear();
    const rendered = render(<AuthProvider><div>child</div></AuthProvider>);
    expect(state.resolveSession).toBeTypeOf('function');
    rendered.unmount();
    expect(state.unsubscribe).toHaveBeenCalledTimes(1);

    await act(async () => {
      state.resolveSession?.({ data: { session: null } });
      await Promise.resolve();
    });
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
