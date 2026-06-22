import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n';
import { AdminPage } from './AdminPage';

const a = vi.hoisted(() => ({ configured: true }));
const fetchOrders = vi.hoisted(() => vi.fn());
const fetchOrderById = vi.hoisted(() => vi.fn());
const signatureUrl = vi.hoisted(() => vi.fn(async () => null));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ configured: a.configured }) }));
vi.mock('../lib/orders', () => ({ fetchOrders, fetchOrderById, signatureUrl }));

const renderAdmin = () =>
  render(
    <I18nProvider>
      <MemoryRouter><AdminPage /></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  a.configured = true;
  fetchOrders.mockReset();
  fetchOrderById.mockReset();
  signatureUrl.mockReset().mockResolvedValue(null);
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

  it('renders all orders in a table (including rows without an event date)', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 },
      { id: 'o2', created_at: '2026-06-03T10:00:00Z', groom_name: 'רון', bride_name: 'מיה', event_date: null, package_title: 'חופה', total_price: 5000 }
    ]);
    renderAdmin();
    await waitFor(() => expect(screen.getByText(/דנה/)).toBeInTheDocument());
    expect(screen.getByText('בר מתוק')).toBeInTheDocument();
    expect(screen.getByText('₪2,500')).toBeInTheDocument();
    // שורה ללא תאריך אירוע מציגה "—"
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(fetchOrders).toHaveBeenCalledWith();
  });

  it('falls back to blocked when the query throws', async () => {
    fetchOrders.mockRejectedValue(new Error('rls'));
    renderAdmin();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
  });

  it('switches to the catalog tab and hides the orders table', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 }
    ]);
    renderAdmin();
    await waitFor(() => expect(screen.getByText('בר מתוק')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ניהול קטלוג/ }));
    expect(screen.queryByText('בר מתוק')).not.toBeInTheDocument();
  });

  it('opens the full order detail modal when a row is clicked', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 }
    ]);
    fetchOrderById.mockResolvedValue({
      id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', groom_phone: '050', bride_phone: '052',
      email: 'a@b.com', event_date: '2026-09-01', event_location: 'חדרה', package_id: 'bar-candy', package_title: 'בר מתוק',
      table_tier: null, composites_count: null, sponge_count: null, include_delivery: true, upgrades: [{ description: 'תוספת', price: 100 }],
      base_price: 2500, upgrades_total: 100, delivery_price: 500, coupon_code: null, coupon_discount: 0, total_price: 3100,
      status: 'paid', groom_sign_date: '2026-01-01', bride_sign_date: '2026-01-01', groom_signature_path: 'o1/g.png', bride_signature_path: 'o1/b.png'
    });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('בר מתוק')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /צפייה בהזמנה/ }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'פרטי הזמנה מלאים' })).toBeInTheDocument());
    expect(fetchOrderById).toHaveBeenCalledWith('o1');
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText('תוספת')).toBeInTheDocument();
    // סגירת המודאל (covers the onClose handler)
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the order detail modal with the keyboard (Enter / Space) on a row', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 }
    ]);
    fetchOrderById.mockResolvedValue({
      id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', groom_phone: '050', bride_phone: '052',
      email: 'a@b.com', event_date: '2026-09-01', event_location: 'חדרה', package_id: 'bar-candy', package_title: 'בר מתוק',
      table_tier: null, composites_count: null, sponge_count: null, referral_source: null, referral_detail: null,
      include_delivery: false, upgrades: [], base_price: 2500, upgrades_total: 0, delivery_price: 0, coupon_code: null,
      coupon_discount: 0, order_source: null, received_by: null, internal_notes: null, admin_discount: 0,
      total_price: 2500, status: 'paid', groom_sign_date: null, bride_sign_date: null,
      groom_signature_path: null, bride_signature_path: null
    });
    renderAdmin();
    await waitFor(() => expect(screen.getByText('בר מתוק')).toBeInTheDocument());
    const row = screen.getByRole('button', { name: /צפייה בהזמנה/ });

    // a non-activating key is ignored (covers the guard branch)
    fireEvent.keyDown(row, { key: 'Tab' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Space activates
    fireEvent.keyDown(row, { key: ' ' });
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'פרטי הזמנה מלאים' })).toBeInTheDocument());
    expect(fetchOrderById).toHaveBeenCalledWith('o1');
  });
});
