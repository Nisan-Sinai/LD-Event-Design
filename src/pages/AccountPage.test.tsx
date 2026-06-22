import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n';
import { AccountPage } from './AccountPage';

const a = vi.hoisted(() => ({ configured: true, user: { id: 'u1' } as { id: string } | null }));
const fetchOrders = vi.hoisted(() => vi.fn());
const fetchOrderById = vi.hoisted(() => vi.fn());
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ configured: a.configured, user: a.user }) }));
vi.mock('../lib/orders', () => ({ fetchOrders, fetchOrderById, signatureUrl: vi.fn(async () => null) }));

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
  fetchOrderById.mockReset();
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

  it('renders the customer orders (with and without event date/location)', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', package_title: 'חבילת חתונה', event_date: '2026-09-01', event_location: 'חדרה', total_price: 4600 },
      { id: 'o2', package_title: 'חבילת חינה', event_date: null, event_location: null, total_price: 1800 }
    ]);
    renderAccount();
    await waitFor(() => expect(screen.getByText('חבילת חתונה')).toBeInTheDocument());
    expect(screen.getByText('₪4,600')).toBeInTheDocument();
    // הזמנה ללא תאריך/מיקום מציגה מציין ריק "—"
    expect(screen.getByText('חבילת חינה')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('opens the order detail modal when an order card is clicked', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', package_title: 'חבילת חתונה', event_date: '2026-09-01', event_location: 'חדרה', total_price: 4600 }
    ]);
    fetchOrderById.mockResolvedValue({
      id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', groom_phone: '050', bride_phone: '052',
      email: 'a@b.com', event_date: '2026-09-01', event_location: 'חדרה', package_id: 'p', package_title: 'חבילת חתונה',
      table_tier: null, composites_count: null, sponge_count: null, referral_source: null, referral_detail: null,
      include_delivery: false, upgrades: [], base_price: 4600, upgrades_total: 0, delivery_price: 0, coupon_code: null,
      coupon_discount: 0, order_source: null, received_by: null, internal_notes: null, admin_discount: 0,
      total_price: 4600, status: 'paid', groom_sign_date: null, bride_sign_date: null,
      groom_signature_path: null, bride_signature_path: null
    });
    renderAccount();
    await waitFor(() => expect(screen.getByText('חבילת חתונה')).toBeInTheDocument());
    fireEvent.click(screen.getByText('חבילת חתונה'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(fetchOrderById).toHaveBeenCalledWith('o1');
    // סגירת המודאל (covers the onClose handler)
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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
