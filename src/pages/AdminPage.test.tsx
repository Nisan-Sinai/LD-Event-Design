import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n';
import { AdminPage } from './AdminPage';

const a = vi.hoisted(() => ({ configured: true }));
const fetchOrders = vi.hoisted(() => vi.fn());
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ configured: a.configured }) }));
vi.mock('../lib/orders', () => ({ fetchOrders }));

const renderAdmin = () =>
  render(
    <I18nProvider>
      <MemoryRouter><AdminPage /></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  a.configured = true;
  fetchOrders.mockReset();
});

describe('AdminPage', () => {
  it('shows blocked when not configured (no query)', async () => {
    a.configured = false;
    renderAdmin();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
    expect(fetchOrders).not.toHaveBeenCalled();
  });

  it('shows empty state', async () => {
    fetchOrders.mockResolvedValue([]);
    renderAdmin();
    await waitFor(() => expect(screen.getByText('אין הזמנות עדיין.')).toBeInTheDocument());
  });

  it('renders all orders in a table', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 }
    ]);
    renderAdmin();
    await waitFor(() => expect(screen.getByText(/דנה/)).toBeInTheDocument());
    expect(screen.getByText('בר מתוק')).toBeInTheDocument();
    expect(screen.getByText('₪2,500')).toBeInTheDocument();
    expect(fetchOrders).toHaveBeenCalledWith();
  });

  it('falls back to blocked when the query throws', async () => {
    fetchOrders.mockRejectedValue(new Error('rls'));
    renderAdmin();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
  });
});
