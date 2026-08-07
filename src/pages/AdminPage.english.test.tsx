import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { AdminPage } from './AdminPage';

const fetchOrders = vi.hoisted(() => vi.fn(async () => []));
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ configured: true, user: null })
}));
vi.mock('../lib/orders', () => ({
  fetchOrders,
  fetchOrderById: vi.fn(),
  signatureUrl: vi.fn(async () => null)
}));
vi.mock('../components/ProductManager', () => ({ ProductManager: () => <section>EN PRODUCT MANAGER</section> }));
vi.mock('../components/PackageManager', () => ({ PackageManager: () => <section>EN PACKAGE MANAGER</section> }));

beforeEach(() => {
  window.localStorage.setItem('ld-lang', 'en');
  fetchOrders.mockClear().mockResolvedValue([]);
});

describe('AdminPage English', () => {
  it('renders the complete media-first dashboard without an order-details shortcut', async () => {
    render(
      <I18nProvider>
        <MemoryRouter><AdminPage /></MemoryRouter>
      </I18nProvider>
    );

    expect(screen.getByRole('heading', { name: 'Website & catalogue management' })).toBeInTheDocument();
    expect(screen.getByText('Images & media')).toBeInTheDocument();
    expect(screen.getByText('Content & pricing')).toBeInTheDocument();
    expect(screen.getByText('Full catalogue control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Images, products & packages' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('EN PRODUCT MANAGER')).toBeInTheDocument();
    expect(screen.getByText('EN PACKAGE MANAGER')).toBeInTheDocument();
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
    await waitFor(() => expect(fetchOrders).toHaveBeenCalledTimes(1));
  });
});
