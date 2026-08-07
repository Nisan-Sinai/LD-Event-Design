import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../components/Spinner';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!configured) return <>{children}</>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, loading, roleLoading } = useAuth();
  const location = useLocation();
  // ממתינים גם לתשובת is_admin מהשרת — בלי זה מנהל אמיתי היה מוקפץ ל-'/'.
  if (loading || roleLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
