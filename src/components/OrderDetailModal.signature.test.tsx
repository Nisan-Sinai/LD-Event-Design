import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { OrderDetailModal } from './OrderDetailModal';
import type { OrderDetail } from '../lib/orders';

const fetchOrderById = vi.hoisted(() => vi.fn());
const signatureUrl = vi.hoisted(() => vi.fn());

vi.mock('../lib/orders', () => ({ fetchOrderById, signatureUrl }));

const websiteOrder: OrderDetail = {
  id: '5049fce7-a7df-4494-bc98-6052719d3343',
  created_at: '2026-08-11T09:30:19.689Z',
  groom_name: 'לקוח',
  bride_name: '-',
  email: 'customer@example.com',
  event_date: '2026-08-27',
  event_location: 'יארה',
  package_title: 'סידור פרחים בינוני × 16',
  total_price: 4800,
  status: 'new',
  groom_phone: '0500000000',
  bride_phone: '0500000000',
  package_id: 'product-sponge-medium',
  table_tier: null,
  composites_count: null,
  sponge_count: null,
  referral_source: 'website-order-selection',
  referral_detail: null,
  include_delivery: false,
  upgrades: [],
  base_price: 4800,
  upgrades_total: 0,
  delivery_price: 0,
  coupon_code: null,
  coupon_discount: 0,
  order_source: 'website-order-selection',
  received_by: null,
  internal_notes: null,
  admin_discount: 0,
  groom_sign_date: '2026-08-11',
  bride_sign_date: null,
  groom_signature_path: '5049fce7-a7df-4494-bc98-6052719d3343/primary.png',
  bride_signature_path: null
};

function renderOrder(order: OrderDetail, showInternal = true) {
  fetchOrderById.mockResolvedValue(order);
  return render(
    <I18nProvider>
      <OrderDetailModal orderId={order.id} onClose={() => {}} showInternal={showInternal} />
    </I18nProvider>
  );
}

beforeEach(() => {
  fetchOrderById.mockReset();
  signatureUrl.mockReset();
  window.localStorage.setItem('ld-lang', 'he');
});

describe('OrderDetailModal website-order signature', () => {
  it('loads the private signature with a signed URL and shows it in admin', async () => {
    signatureUrl.mockImplementation(async (path: string | null) =>
      path ? `https://signed.example/${path}` : null
    );
    renderOrder(websiteOrder);

    await waitFor(() => expect(screen.getByText('חתימות')).toBeInTheDocument());
    expect(screen.getByText('חתימת הלקוח')).toBeInTheDocument();

    const signature = await screen.findByRole('img', { name: 'חתימת הלקוח' });
    expect(signature).toHaveAttribute(
      'src',
      'https://signed.example/5049fce7-a7df-4494-bc98-6052719d3343/primary.png'
    );
    expect(signatureUrl).toHaveBeenCalledWith('5049fce7-a7df-4494-bc98-6052719d3343/primary.png');

    const fullSizeLinks = screen.getAllByRole('link', { name: 'פתיחת החתימה בגודל מלא' });
    expect(fullSizeLinks[0]).toHaveAttribute(
      'href',
      'https://signed.example/5049fce7-a7df-4494-bc98-6052719d3343/primary.png'
    );
  });

  it('renders both stored signatures and supports a signature without a date', async () => {
    const twoSignatures: OrderDetail = {
      ...websiteOrder,
      bride_signature_path: `${websiteOrder.id}/secondary.png`,
      bride_sign_date: null
    };
    signatureUrl.mockImplementation(async (path: string | null) =>
      path ? `https://signed.example/${path}` : null
    );
    renderOrder(twoSignatures);

    expect(await screen.findByRole('img', { name: 'חתימת הלקוח' })).toBeInTheDocument();
    const secondary = await screen.findByRole('img', { name: 'חתימה נוספת' });
    expect(secondary).toHaveAttribute('src', `https://signed.example/${websiteOrder.id}/secondary.png`);
    expect(signatureUrl).toHaveBeenCalledWith(`${websiteOrder.id}/secondary.png`);
  });

  it('shows a safe fallback when the stored signature cannot get a signed URL', async () => {
    signatureUrl.mockResolvedValue(null);
    renderOrder(websiteOrder);

    await waitFor(() => {
      expect(screen.getByText('החתימה שמורה אך לא ניתן לטעון אותה כרגע.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('img', { name: 'חתימת הלקוח' })).not.toBeInTheDocument();
  });

  it('does not request or expose signatures outside the admin view', async () => {
    signatureUrl.mockResolvedValue('https://signed.example/hidden.png');
    renderOrder(websiteOrder, false);

    await screen.findByText('customer@example.com');
    expect(screen.queryByText('חתימת הלקוח')).not.toBeInTheDocument();
    expect(signatureUrl).not.toHaveBeenCalled();
  });

  it('does not render a signature section when a website order has no stored signature', async () => {
    signatureUrl.mockResolvedValue('https://signed.example/unused.png');
    renderOrder({
      ...websiteOrder,
      groom_signature_path: null,
      bride_signature_path: null,
      groom_sign_date: null
    });

    await screen.findByText('customer@example.com');
    expect(screen.queryByText('חתימות')).not.toBeInTheDocument();
    expect(signatureUrl).not.toHaveBeenCalled();
  });

  it('uses the English labels for the same protected signature preview', async () => {
    window.localStorage.setItem('ld-lang', 'en');
    signatureUrl.mockImplementation(async (path: string | null) =>
      path ? `https://signed.example/${path}` : null
    );
    renderOrder(websiteOrder);

    expect(await screen.findByRole('img', { name: 'Customer signature' })).toBeInTheDocument();
    expect(screen.getByText('Signatures')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open signature full size' })).toBeInTheDocument();
  });
});
