import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AUTH_RETURN_KEY = 'ld-event-design-auth-return';

export type Role = 'guest' | 'customer' | 'admin';

interface AuthResult {
  error: string | null;
}

interface AuthValue {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  /** דולק כל עוד תשובת is_admin מהשרת עדיין לא ודאית. */
  roleLoading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (returnTo?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

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
  const [role, setRole] = useState<Role>('guest');
  // מתחיל דלוק כדי שלא ייווצר רגע שבו שתי הטעינות כבויות והתפקיד עדיין לא ידוע.
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setRoleLoading(false);
      return;
    }
    let active = true;
    let requestId = 0;

    // מקור האמת לתפקיד הוא השרת (public.is_admin). עד לתשובה ודאית נשארים
    // על 'customer' — ברירת המחדל הבטוחה — ולעולם לא נופלים ל-'admin'.
    const resolveRole = async (next: Session | null) => {
      const current = ++requestId;
      if (!next?.user) {
        setRole('guest');
        setRoleLoading(false);
        return;
      }
      setRole('customer');
      setRoleLoading(true);
      let resolved: Role = 'customer';
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && data === true) resolved = 'admin';
      } catch {
        // כשל רשת/RPC — נשארים על ברירת המחדל הבטוחה.
      }
      // תשובה שהוחלפה על ידי בקשה חדשה יותר, או קומפוננטה שהתפרקה — מתעלמים.
      if (!active || current !== requestId) return;
      setRole(resolved);
      setRoleLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
        void resolveRole(data.session);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      void resolveRole(s);
      if (event === 'SIGNED_IN' && s?.user) void supabase.rpc('claim_my_orders');
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

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
        roleLoading,
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
