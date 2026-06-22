import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { OrderDetailModal } from './OrderDetailModal';
import type { OrderDetail } from '../lib/orders';

const fetchOrderById = vi.hoisted(() => vi.fn());
const signatureUrl = vi.hoisted(() => vi.fn());
vi.mock('../lib/orders', () => ({ fetchOrderById, signatureUrl }));

const baseOrder: OrderDetail = {
  id: 'o1',
  created_at: '2026-06-02T10:00:00Z',
  groom_name: 'דנה',
  bride_name: 'יוסי',
  email: 'a@b.com',
  event_date: '2026-09-01',
  event_location: 'חדרה',
  package_title: 'בר מתוק',
  total_price: 3100,
  status: 'paid',
  groom_phone: '050-1111111',
  bride_phone: '052-2222222',
  package_id: 'bar-candy',
  table_tier: 2,
  composites_count: '3',
  sponge_count: '1',
  referral_source: 'instagram',
  referral_detail: 'סטורי',
  include_delivery: true,
  upgrades: [{ description: 'תוספת פרחים', price: 100 }],
  base_price: 2500,
  upgrades_total: 100,
  delivery_price: 500,
  coupon_code: 'SAVE10',
  coupon_discount: 50,
  order_source: 'whatsapp',
  received_by: 'liron',
  internal_notes: 'לקוח חוזר',
  admin_discount: 200,
  groom_sign_date: '2026-01-01',
  bride_sign_date: '2026-01-02',
  groom_signature_path: 'o1/g.png',
  bride_signature_path: 'o1/b.png'
};

const renderModal = (props: Partial<React.ComponentProps<typeof OrderDetailModal>> = {}) =>
  render(
    <I18nProvider>
      <OrderDetailModal orderId="o1" onClose={() => {}} {...props} />
    </I18nProvider>
  );

beforeEach(() => {
  fetchOrderById.mockReset();
  signatureUrl.mockReset().mockResolvedValue(null);
});

describe('OrderDetailModal', () => {
  it('renders nothing when orderId is null', () => {
    const { container } = render(
      <I18nProvider>
        <OrderDetailModal orderId={null} onClose={() => {}} />
      </I18nProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the loading state while the order is being fetched', () => {
    fetchOrderById.mockReturnValue(new Promise(() => {})); // never resolves
    renderModal();
    expect(screen.getByText('טוען…')).toBeInTheDocument();
  });

  it('shows the error state when the fetch rejects', async () => {
    fetchOrderById.mockRejectedValue(new Error('rls'));
    renderModal();
    await waitFor(() => expect(screen.getByText(/נדרשת הגדרת Supabase/)).toBeInTheDocument());
  });

  it('renders a full order with internal admin metadata when showInternal is set', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    signatureUrl.mockResolvedValue('https://x/sig.png');
    renderModal({ showInternal: true });

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    // upgrade line
    expect(screen.getByText('תוספת פרחים')).toBeInTheDocument();
    // internal note (admin-only) is visible
    expect(screen.getByText('לקוח חוזר')).toBeInTheDocument();
    // signature images rendered with an accessible alt
    const sigImgs = screen.getAllByRole('img');
    expect(sigImgs.length).toBe(2);
    expect(sigImgs[0]).toHaveAttribute('alt');
  });

  it('hides admin-only metadata when showInternal is false', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    renderModal({ showInternal: false });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    expect(screen.queryByText('לקוח חוזר')).not.toBeInTheDocument();
  });

  it('renders a minimal order (no upgrades / coupons / referral / signatures) using the empty fallbacks', async () => {
    fetchOrderById.mockResolvedValue({
      ...baseOrder,
      event_date: null,
      event_location: null,
      table_tier: null,
      composites_count: null,
      sponge_count: null,
      referral_source: null,
      referral_detail: null,
      include_delivery: false,
      upgrades: [],
      upgrades_total: 0,
      delivery_price: 0,
      coupon_code: null,
      coupon_discount: 0,
      order_source: null,
      received_by: null,
      internal_notes: null,
      admin_discount: 0,
      groom_sign_date: null,
      bride_sign_date: null,
      groom_signature_path: null,
      bride_signature_path: null
    });
    renderModal({ showInternal: true });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    // signatures unavailable -> textual fallback (no <img>)
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('falls back to a textual placeholder when a signature image fails to load', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    signatureUrl.mockResolvedValue('https://x/broken.png');
    renderModal({ showInternal: true });
    await waitFor(() => expect(screen.getAllByRole('img').length).toBe(2));
    fireEvent.error(screen.getAllByRole('img')[0]);
    await waitFor(() => expect(screen.getAllByRole('img').length).toBe(1));
  });

  it('renders the raw status string when no translation key matches', async () => {
    fetchOrderById.mockResolvedValue({ ...baseOrder, status: 'zz_unknown' });
    renderModal();
    await waitFor(() => expect(screen.getByText(/zz_unknown/)).toBeInTheDocument());
  });

  it('handles a referral without detail and unknown source/received keys (raw fallbacks)', async () => {
    fetchOrderById.mockResolvedValue({
      ...baseOrder,
      // money(null) -> ₪0 fallback branch
      base_price: null as unknown as number,
      referral_source: 'instagram',
      referral_detail: null,
      order_source: 'zz_src',
      received_by: 'zz_rcv'
    });
    renderModal({ showInternal: true });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    // unknown admin source/received keys fall back to the raw value
    expect(screen.getByText('zz_src')).toBeInTheDocument();
    expect(screen.getByText('zz_rcv')).toBeInTheDocument();
  });

  it('renders the empty dialog body when the order is not found (null)', async () => {
    fetchOrderById.mockResolvedValue(null);
    renderModal();
    // הדיאלוג קיים אך ללא תוכן הזמנה, וללא קריאה ל-signatureUrl
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('טוען…')).not.toBeInTheDocument());
    expect(signatureUrl).not.toHaveBeenCalled();
  });

  it('renders the admin section with only a source (other admin rows fall back to null)', async () => {
    fetchOrderById.mockResolvedValue({
      ...baseOrder, order_source: 'whatsapp', received_by: null, internal_notes: null
    });
    renderModal({ showInternal: true });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    expect(screen.queryByText('לקוח חוזר')).not.toBeInTheDocument();
  });

  it('ignores non-Escape keys', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    const onClose = vi.fn();
    renderModal({ onClose });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on backdrop click, Escape key, and the close button', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    const onClose = vi.fn();
    renderModal({ onClose });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());

    // backdrop (the dialog container) click closes
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape closes
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // explicit close button closes
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when the dialog body itself is clicked', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    const onClose = vi.fn();
    renderModal({ onClose });
    const title = await screen.findByText('a@b.com');
    fireEvent.click(title);
    expect(onClose).not.toHaveBeenCalled();
  });
});
