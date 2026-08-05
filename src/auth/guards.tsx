import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#B29259] border-t-transparent rounded-full animate-spin" role="status" aria-label="loading" />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  // אם Supabase לא הוגדר — מאפשרים גישה (אורח), כי אין מערכת התחברות פעילה
  if (!configured) return <>{children}</>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
