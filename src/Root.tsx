import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { RequireAdmin, RequireAuth } from './auth/guards';
import { SiteLayout } from './components/SiteLayout';
import { Spinner } from './components/Spinner';
import { PackagesProvider } from './packages/PackagesProvider';

// כל מסלול נטען עצלה כדי שהצ'אנק הראשי לא יישא את אזור הניהול והטופס הישן.
// העמודים מיוצאים בשם, ולכן ממופים ל-default שעליו React.lazy מסתמך.
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const OrderPage = lazy(() => import('./App'));

// גבול ה-Suspense יושב בתוך ה-layout כדי שהכותרת והניווט יישארו על המסך
// בזמן הורדת הצ'אנק, במקום שהעמוד כולו יוחלף בספינר.
function Page({ children }: { children: ReactNode }) {
  return (
    <SiteLayout>
      <Suspense fallback={<Spinner />}>{children}</Suspense>
    </SiteLayout>
  );
}

function ScrollToLocation() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const rawId = location.hash.slice(1);
    let targetId = rawId;
    try {
      targetId = decodeURIComponent(rawId);
    } catch {
      // Keep the raw hash when it is not valid URI-encoded text.
    }

    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (!target) return false;
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      return true;
    };

    if (scrollToTarget()) return;

    // Lazy routes can render after the URL changes; wait for their anchor to enter the DOM.
    const observer = new MutationObserver(() => {
      if (scrollToTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 2500);

    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.hash, location.key, location.pathname]);

  return null;
}

export function Root() {
  return (
    <AuthProvider>
      <PackagesProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToLocation />
            <Routes>
              <Route path="/" element={<Page><HomePage /></Page>} />
              <Route path="/cart" element={<Page><CartPage /></Page>} />
              <Route path="/checkout" element={<Page><CheckoutPage /></Page>} />
              <Route path="/login" element={<Page><LoginPage /></Page>} />
              <Route path="/register" element={<Page><RegisterPage /></Page>} />
              <Route path="/reset-password" element={<Page><ResetPasswordPage /></Page>} />
              {/* הטופס הישן נשאר זמין למנהל ולהזמנות חוזה מורכבות. */}
              <Route
                path="/order"
                element={
                  <Suspense fallback={<Spinner />}>
                    <OrderPage />
                  </Suspense>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Page><AccountPage /></Page>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Page><AdminPage /></Page>
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </PackagesProvider>
    </AuthProvider>
  );
}
