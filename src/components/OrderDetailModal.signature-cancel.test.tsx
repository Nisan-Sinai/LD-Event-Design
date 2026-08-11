import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { OrderDetailModal } from './OrderDetailModal';
import type { OrderDetail } from '../lib/orders';

const fetchOrderById = vi.hoisted(() => vi.fn());
const signatureUrl = vi.hoisted(() => vi.fn());
vi.mock('../lib/orders', () => ({ fetchOrderById, signatureUrl }));

const order: OrderDetail = {
  id: 'cancel-signature-order',
  created_at: '2026-08-11T09:30:19.689Z',
  groom_name: 'לקוח',
  bride_name: 'לקוחה',
  email: 'customer@example.com',
  event_date: '2026-08-27',
  event_location: 'יארה',
  package_title: 'חבילה',
  total_price: 4800,
  status: 'new',
  groom_phone: '0500000000',
  bride_phone: '0500000001',
  package_id: 'p1',
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
  bride_sign_date: '2026-08-11',
  groom_signature_path: 'cancel-signature-order/primary.png',
  bride_signature_path: 'cancel-signature-order/secondary.png'
};

describe('OrderDetailModal cancelled signature request', () => {
  it('shows loading and ignores signed URLs that resolve after the modal unmounts', async () => {
    fetchOrderById.mockResolvedValue(order);
    let resolvePrimary!: (value: string | null) => void;
    let resolveSecondary!: (value: string | null) => void;
    signatureUrl.mockImplementation((path: string | null) => new Promise<string | null>((resolve) => {
      if (path?.endsWith('primary.png')) resolvePrimary = resolve;
      else resolveSecondary = resolve;
    }));

    const view = render(
      <I18nProvider>
        <OrderDetailModal orderId={order.id} onClose={() => {}} showInternal />
      </I18nProvider>
    );

    expect(await screen.findByText('טוען חתימה…')).toBeInTheDocument();
    view.unmount();

    resolvePrimary('https://signed.example/primary.png');
    resolveSecondary('https://signed.example/secondary.png');
    await Promise.resolve();
    await Promise.resolve();

    expect(signatureUrl).toHaveBeenCalledTimes(2);
  });
});
