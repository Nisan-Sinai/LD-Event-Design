import { lazy, Suspense, useLayoutEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { RequireAdmin, RequireAuth } from './auth/guards';
import { SiteLayout } from './components/SiteLayout';
import { Spinner } from './components/Spinner';
import { PackagesProvider } from './packages/PackagesProvider';

// כל מסלול נטען עצלה כדי שהצ'אנק הראשי יישאר קטן ומהיר.
// העמודים מיוצאים בשם, ולכן ממופים ל-default שעליו React.lazy מסתמך.
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));

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

  useLayoutEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | undefined;

    const rawId = location.hash.slice(1);
    let targetId = rawId;
    try {
      targetId = decodeURIComponent(rawId);
    } catch {
      // Keep the raw hash when it is not valid URI-encoded text.
    }

    const alignLocation = () => {
      if (cancelled) return false;

      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        return true;
      }

      const target = document.getElementById(targetId);
      if (!target) return false;
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      return true;
    };

    const alignedImmediately = alignLocation();
    if (!location.hash) return;

    if (!alignedImmediately) {
      // Lazy routes can render after the URL changes; wait for their anchor to enter the DOM.
      observer = new MutationObserver(() => {
        if (alignLocation()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Hash targets get a few extra alignment passes while lazy content settles.
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      alignLocation();
      secondFrame = window.requestAnimationFrame(() => {
        alignLocation();
      });
    });
    const settleTimer = window.setTimeout(alignLocation, 120);
    const observerTimer = window.setTimeout(() => observer?.disconnect(), 2500);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(observerTimer);
      observer?.disconnect();
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
              {/* קישור ישן: שולחים תמיד לבונה החבילה הפעיל. */}
              <Route path="/order" element={<Navigate to="/#packages" replace />} />
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
