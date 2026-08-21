import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { AdminPage } from './AdminPage';

const fetchOrders = vi.hoisted(() => vi.fn(async () => []));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ configured: true, user: { email: 'admin@example.com' } })
}));
vi.mock('../lib/orders', () => ({
  fetchOrders,
  fetchOrderById: vi.fn(),
  deleteOrder: vi.fn(),
  signatureUrl: vi.fn(async () => null)
}));
vi.mock('../components/ProductManager', () => ({ ProductManager: () => <section>PRODUCTS</section> }));
vi.mock('../components/PackageManager', () => ({ PackageManager: () => <section>PACKAGES</section> }));
vi.mock('../components/BrandingManager', () => ({ BrandingManager: () => <section>BRANDING</section> }));

const renderAdmin = () => render(
  <I18nProvider>
    <MemoryRouter><AdminPage /></MemoryRouter>
  </I18nProvider>
);

beforeEach(() => {
  fetchOrders.mockClear();
  window.history.replaceState({}, '', '/admin');
});

describe('AdminPage tab persistence', () => {
  it('stores the selected tab in the URL and restores it after remount', () => {
    const firstRender = renderAdmin();
    const categories = screen.getByRole('button', { name: 'ניהול קטגוריות' });

    fireEvent.click(categories);
    expect(window.location.search).toBe('?tab=categories');
    expect(categories).toHaveAttribute('aria-pressed', 'true');

    firstRender.unmount();
    renderAdmin();

    expect(screen.getByRole('button', { name: 'ניהול קטגוריות' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'תמונות, מוצרים וחבילות' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens directly on orders when the URL already points there', () => {
    window.history.replaceState({}, '', '/admin?tab=orders');
    renderAdmin();

    expect(screen.getByRole('button', { name: 'ניהול הזמנות' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'תמונות, מוצרים וחבילות' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('syncs the active tab from browser history changes', () => {
    renderAdmin();

    window.history.replaceState({}, '', '/admin?tab=orders');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByRole('button', { name: 'ניהול הזמנות' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'תמונות, מוצרים וחבילות' })).toHaveAttribute('aria-pressed', 'false');
  });
});
