import { isSupabaseConfigured, supabase } from './supabase';

export interface CartOrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface CartCustomerDetails {
  fullName: string;
  additionalName: string;
  phone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  notes: string;
}

export interface QuotePreferences {
  palette: string;
  customColors: string;
  flowerColor: string;
  balloonColor: string;
  tableclothColor: string;
  customRequest: string;
  couponCode: string;
  couponApplied: boolean;
}

export interface CartOrderInput {
  customer: CartCustomerDetails;
  items: CartOrderItem[];
  preferences: QuotePreferences;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
}

export async function submitCartOrder(input: CartOrderInput): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  if (!isSupabaseConfigured) return { id };

  const packageTitle = input.items
    .map((item) => `${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`)
    .join(' | ');

  const quoteMetadata = {
    palette: input.preferences.palette,
    customColors: input.preferences.customColors,
    flowerColor: input.preferences.flowerColor,
    balloonColor: input.preferences.balloonColor,
    tableclothColor: input.preferences.tableclothColor,
    customRequest: input.preferences.customRequest,
    customerNotes: input.customer.notes,
    quoteOnly: true,
    noPaymentCollected: true,
    policyAcceptedAt: new Date().toISOString(),
    policyVersion: '2026-08-07'
  };

  const { error } = await supabase.from('orders').insert({
    id,
    groom_name: input.customer.fullName.trim(),
    bride_name: input.customer.additionalName.trim() || '-',
    groom_phone: input.customer.phone.trim(),
    bride_phone: input.customer.phone.trim(),
    email: input.customer.email.trim(),
    event_date: input.customer.eventDate || null,
    event_location: input.customer.eventLocation.trim(),
    referral_source: 'website-quote-builder',
    referral_detail: JSON.stringify(quoteMetadata),
    package_id: input.items.map((item) => item.id).join(','),
    package_title: packageTitle,
    table_tier: null,
    composites_count: null,
    sponge_count: null,
    include_delivery: false,
    upgrades: input.items.map((item) => ({
      description: item.title,
      price: item.price,
      quantity: item.quantity
    })),
    base_price: input.subtotal,
    upgrades_total: 0,
    delivery_price: 0,
    coupon_code: input.preferences.couponApplied ? input.preferences.couponCode : null,
    coupon_discount: 0,
    total_price: input.totalPrice,
    groom_sign_date: null,
    bride_sign_date: null,
    groom_signature_path: null,
    bride_signature_path: null,
    status: 'new',
    order_source: 'website-quote-builder',
    internal_notes: JSON.stringify(quoteMetadata),
    admin_discount: 0
  });

  if (error) throw error;
  return { id };
}
