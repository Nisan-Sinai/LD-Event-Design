import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { parseAdminEmails, roleForEmail, type Role } from './roles';

const AUTH_RETURN_KEY = 'ld-event-design-auth-return';

// המנהלים הקבועים תמיד נשמרים; VITE_ADMIN_EMAILS יכול להוסיף מנהלים נוספים.
const BUILT_IN_ADMIN_EMAILS = parseAdminEmails(undefined);
const ENV_ADMIN_EMAILS = parseAdminEmails(
  import.meta.env.VITE_ADMIN_EMAILS as string | undefined,
  ''
);
const ADMIN_EMAILS = Array.from(new Set([...BUILT_IN_ADMIN_EMAILS, ...ENV_ADMIN_EMAILS]));

export type { Role };

interface AuthResult {
  error: string | null;
}

interface AuthValue {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (returnTo?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function roleFor(user: User | null): Role {
  return roleForEmail(user?.email ?? null, ADMIN_EMAILS);
}

function safeReturnPath(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
}

function safeAppUrl(path: string): string {
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';
  return new URL(safePath, window.location.origin).toString();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' && s?.user) void supabase.rpc('claim_my_orders');
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const role = roleFor(user);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'NOT_CONFIGURED' };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'NOT_CONFIGURED' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async (returnTo = '/admin'): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'NOT_CONFIGURED' };
    const safeReturn = safeReturnPath(returnTo);
    window.sessionStorage.setItem(AUTH_RETURN_KEY, safeReturn);
    const callbackPath = `/login?from=${encodeURIComponent(safeReturn)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: safeAppUrl(callbackPath),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });
    return { error: error?.message ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'NOT_CONFIGURED' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: safeAppUrl('/reset-password')
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'NOT_CONFIGURED' };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    window.sessionStorage.removeItem(AUTH_RETURN_KEY);
    if (isSupabaseConfigured) await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        configured: isSupabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
