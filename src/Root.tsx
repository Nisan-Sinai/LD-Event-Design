import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { SiteLayout } from './components/SiteLayout';
import { RequireAuth, RequireAdmin } from './auth/guards';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import OrderPage from './App';

export function Root() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
          <Route path="/login" element={<SiteLayout><LoginPage /></SiteLayout>} />
          <Route path="/register" element={<SiteLayout><RegisterPage /></SiteLayout>} />
          {/* אורח יכול להרכיב הזמנה בחופשיות — ההזדהות נדרשת רק באישור (AuthModal בתוך העמוד) */}
          <Route path="/order" element={<OrderPage />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <SiteLayout><AccountPage /></SiteLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <SiteLayout><AdminPage /></SiteLayout>
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
