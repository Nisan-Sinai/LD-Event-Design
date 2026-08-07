import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { AdminPage } from './AdminPage';

const a = vi.hoisted(() => ({
  configured: true,
  user: { email: 'nisan.sinai5@gmail.com' } as { email?: string } | null
}));
const fetchOrders = vi.hoisted(() => vi.fn());
const fetchOrderById = vi.hoisted(() => vi.fn());
const signatureUrl = vi.hoisted(() => vi.fn(async () => null));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ configured: a.configured, user: a.user })
}));
vi.mock('../lib/orders', () => ({ fetchOrders, fetchOrderById, signatureUrl }));
vi.mock('../components/ProductManager', () => ({ ProductManager: () => <section>PRODUCT MEDIA MANAGER</section> }));
vi.mock('../components/PackageManager', () => ({ PackageManager: () => <section>PACKAGE MEDIA MANAGER</section> }));

const renderAdmin = () =>
  render(
    <I18nProvider>
      <MemoryRouter><AdminPage /></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  a.configured = true;
  a.user = { email: 'nisan.sinai5@gmail.com' };
  fetchOrders.mockReset().mockResolvedValue([]);
  fetchOrderById.mockReset();
  signatureUrl.mockReset().mockResolvedValue(null);
});

describe('AdminPage', () => {
  it('opens on catalogue and image management by default', async () => {
    renderAdmin();
    expect(screen.getByRole('heading', { name: 'ניהול האתר והקטלוג' })).toBeInTheDocument();
    expect(screen.getByText('nisan.sinai5@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('PRODUCT MEDIA MANAGER')).toBeInTheDocument();
    expect(screen.getByText('PACKAGE MEDIA MANAGER')).toBeInTheDocument();
    expect(screen.getByText('תמונות ומדיה')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /הזמנה חדשה|מילוי פרטים/ })).not.toBeInTheDocument();
    await waitFor(() => expect(fetchOrders).toHaveBeenCalledWith());
  });

  it('shows blocked orders state when Supabase is not configured', async () => {
    a.configured = false;
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
    expect(fetchOrders).not.toHaveBeenCalled();
  });

  it('shows the empty orders state after switching tabs', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText('אין הזמנות עדיין.')).toBeInTheDocument());
  });

  it('renders all orders and rows without an event date', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 },
      { id: 'o2', created_at: '2026-06-03T10:00:00Z', groom_name: 'רון', bride_name: 'מיה', event_date: null, package_title: 'חופה', total_price: 5000 }
    ]);
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText(/דנה/)).toBeInTheDocument());
    expect(screen.getByText('בר מתוק')).toBeInTheDocument();
    expect(screen.getByText('₪2,500')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('falls back to blocked when the orders query throws', async () => {
    fetchOrders.mockRejectedValue(new Error('rls'));
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
  });

  it('returns from orders to catalogue management', async () => {
    fetchOrders.mockResolvedValue([
      { id: 'o1', created_at: '2026-06-02T10:00:00Z', groom_name: 'דנה', bride_name: 'יוסי', event_date: '2026-09-01', package_title: 'בר מתוק', total_price: 2500 }
    ]);
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText('בר מתוק')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'תמונות, מוצרים וחבילות' }));
    expect(screen.getByText('PRODUCT MEDIA MANAGER')).toBeInTheDocument();
    expect(screen.queryByText('בר מתוק')).not.toBeInTheDocument();
  });

  it('opens and closes the full order details modal', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'הזמנות' }));
    await waitFor(() => expect(screen.getByText('בר מתוק')).toBeInTheDocument());
    const row = screen.getByRole('button', { name: /צפייה בהזמנה/ });
    fireEvent.keyDown(row, { key: 'Tab' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(row, { key: 'Enter' });
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'פרטי הזמנה מלאים' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
