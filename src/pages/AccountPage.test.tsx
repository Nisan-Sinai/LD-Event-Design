import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n';
import { AccountPage } from './AccountPage';

const a = vi.hoisted(() => ({ configured: true, user: { id: 'u1' } as { id: string } | null }));
const fetchOrders = vi.hoisted(() => vi.fn());
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ configured: a.configured, user: a.user }) }));
vi.mock('../lib/orders', () => ({ fetchOrders, fetchOrderById: vi.fn(), signatureUrl: vi.fn(async () => null) }));

const renderAccount = () =>
  render(
    <I18nProvider>
      <MemoryRouter><AccountPage /></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  a.configured = true;
  a.user = { id: 'u1' };
  fetchOrders.mockReset();
});

describe('AccountPage', () => {
  it('shows blocked when Supabase is not configured', async () => {
    a.configured = false;
    fetchOrders.mockResolvedValue([]);
    renderAccount();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
    expect(fetchOrders).not.toHaveBeenCalled();
  });

  it('shows empty state when there are no orders', async () => {
    fetchOrders.mockResolvedValue([]);
    renderAccount();
    await waitFor(() => expect(screen.getByText('אין לך עדיין הזמנות.')).toBeInTheDocument());
    expect(fetchOrders).toHaveBeenCalledWith({ userId: 'u1' });
  });

  it('renders the customer orders', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', package_title: 'חבילת חתונה', event_date: '2026-09-01', event_location: 'חדרה', total_price: 4600 }
    ]);
    renderAccount();
    await waitFor(() => expect(screen.getByText('חבילת חתונה')).toBeInTheDocument());
    expect(screen.getByText('₪4,600')).toBeInTheDocument();
  });

  it('falls back to blocked when the query throws', async () => {
    fetchOrders.mockRejectedValue(new Error('rls'));
    renderAccount();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
  });

  it('shows empty (not blocked) when configured but no user is present', async () => {
    a.user = null;
    fetchOrders.mockResolvedValue([]);
    renderAccount();
    await waitFor(() => expect(screen.getByText('אין לך עדיין הזמנות.')).toBeInTheDocument());
    expect(fetchOrders).not.toHaveBeenCalled();
  });
});
