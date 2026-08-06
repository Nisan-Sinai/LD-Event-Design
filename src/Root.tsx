import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { RequireAdmin, RequireAuth } from './auth/guards';
import { SiteLayout } from './components/SiteLayout';
import { PackagesProvider } from './packages/PackagesProvider';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import OrderPage from './App';

export function Root() {
  return (
    <AuthProvider>
      <PackagesProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
              <Route path="/cart" element={<SiteLayout><CartPage /></SiteLayout>} />
              <Route path="/checkout" element={<SiteLayout><CheckoutPage /></SiteLayout>} />
              <Route path="/login" element={<SiteLayout><LoginPage /></SiteLayout>} />
              <Route path="/register" element={<SiteLayout><RegisterPage /></SiteLayout>} />
              {/* הטופס הישן נשאר זמין למנהל ולהזמנות חוזה מורכבות. */}
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
        </CartProvider>
      </PackagesProvider>
    </AuthProvider>
  );
}
