import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { OrderDetailModal } from './OrderDetailModal';
import type { OrderDetail } from '../lib/orders';

const fetchOrderById = vi.hoisted(() => vi.fn());
vi.mock('../lib/orders', () => ({ fetchOrderById }));

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
  window.localStorage.setItem('ld-lang', 'he');
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

  it('ignores fetch results that settle after the modal is unmounted', async () => {
    let resolveOrder!: (value: OrderDetail | null) => void;
    fetchOrderById.mockReturnValue(new Promise<OrderDetail | null>((resolve) => {
      resolveOrder = resolve;
    }));
    const first = renderModal();
    first.unmount();
    resolveOrder(baseOrder);
    await Promise.resolve();

    let rejectOrder!: (reason?: unknown) => void;
    fetchOrderById.mockReturnValue(new Promise<OrderDetail | null>((_, reject) => {
      rejectOrder = reject;
    }));
    const second = renderModal();
    second.unmount();
    rejectOrder(new Error('late failure'));
    await Promise.resolve();

    expect(fetchOrderById).toHaveBeenCalledTimes(2);
  });

  it('ignores JSON that is not quote metadata', async () => {
    fetchOrderById.mockResolvedValue({
      ...baseOrder,
      referral_source: null,
      referral_detail: JSON.stringify({ legacy: true }),
      internal_notes: 'null'
    });
    renderModal({ showInternal: true });

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    expect(screen.queryByText('העדפות עיצוב ובקשות')).not.toBeInTheDocument();
  });

  it('renders a full order with internal admin metadata when showInternal is set', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    renderModal({ showInternal: true });

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    // upgrade line
    expect(screen.getByText('תוספת פרחים')).toBeInTheDocument();
    // internal note (admin-only) is visible
    expect(screen.getByText('לקוח חוזר')).toBeInTheDocument();
    // Legacy signature columns may exist on historic rows, but signatures are not part of the product.
    expect(screen.queryByText('חתימות')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('hides admin-only metadata when showInternal is false', async () => {
    fetchOrderById.mockResolvedValue(baseOrder);
    renderModal({ showInternal: false });
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    expect(screen.queryByText('לקוח חוזר')).not.toBeInTheDocument();
  });

  it('renders website quote metadata as readable fields without technical overflow or fake signatures', async () => {
    const quoteMetadata = JSON.stringify({
      flowerColor: 'לבן וזהב',
      balloonColor: 'ורוד פודרה',
      tableclothColor: 'שמפניה',
      customRequest: 'לשמור על מראה נקי',
      customerNotes: 'שולחן קבלת פנים ליד הכניסה',
      policyAcceptedAt: '2026-08-09T00:00:00.000Z'
    });
    fetchOrderById.mockResolvedValue({
      ...baseOrder,
      referral_source: 'website-quote-builder',
      referral_detail: quoteMetadata,
      order_source: 'website-quote-builder',
      received_by: null,
      internal_notes: quoteMetadata,
      groom_sign_date: null,
      bride_sign_date: null,
      groom_signature_path: null,
      bride_signature_path: null
    });

    renderModal({ showInternal: true });

    await waitFor(() => expect(screen.getByText('העדפות עיצוב ובקשות')).toBeInTheDocument());
    expect(screen.getByText('לבן וזהב')).toBeInTheDocument();
    expect(screen.getByText('ורוד פודרה')).toBeInTheDocument();
    expect(screen.getByText('שמפניה')).toBeInTheDocument();
    expect(screen.getByText('לשמור על מראה נקי')).toBeInTheDocument();
    expect(screen.getByText('שולחן קבלת פנים ליד הכניסה')).toBeInTheDocument();
    expect(screen.getByText('בקשת הצעת מחיר מהאתר')).toBeInTheDocument();

    expect(screen.queryByText('website-quote-builder')).not.toBeInTheDocument();
    expect(screen.queryByText(quoteMetadata)).not.toBeInTheDocument();
    expect(screen.queryByText('הגעה דרך')).not.toBeInTheDocument();
    expect(screen.queryByText('חתימות')).not.toBeInTheDocument();

    const dialogSurface = screen.getByRole('dialog').firstElementChild;
    expect(dialogSurface).toHaveClass('min-w-0', 'overflow-x-hidden');
  });

  it('renders website quote labels in English', async () => {
    window.localStorage.setItem('ld-lang', 'en');
    const quoteMetadata = JSON.stringify({ quoteOnly: true, flowerColor: 'Ivory' });
    fetchOrderById.mockResolvedValue({
      ...baseOrder,
      referral_source: 'website-quote-builder',
      referral_detail: null,
      order_source: 'website-quote-builder',
      internal_notes: quoteMetadata
    });
    renderModal({ showInternal: true });

    await waitFor(() => expect(screen.getByText('Design preferences & requests')).toBeInTheDocument());
    expect(screen.getByText('Flower shade')).toBeInTheDocument();
    expect(screen.getByText('Ivory')).toBeInTheDocument();
    expect(screen.getByText('Website quote request')).toBeInTheDocument();
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
    // No signature UI is rendered.
    expect(screen.queryAllByRole('img')).toHaveLength(0);
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
    // הדיאלוג קיים אך ללא תוכן הזמנה.
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('טוען…')).not.toBeInTheDocument());
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
