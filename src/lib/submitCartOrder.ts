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

export interface CartOrderInput {
  customer: CartCustomerDetails;
  items: CartOrderItem[];
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

  const { error } = await supabase.from('orders').insert({
    id,
    groom_name: input.customer.fullName.trim(),
    bride_name: input.customer.additionalName.trim() || '-',
    groom_phone: input.customer.phone.trim(),
    bride_phone: input.customer.phone.trim(),
    email: input.customer.email.trim(),
    event_date: input.customer.eventDate || null,
    event_location: input.customer.eventLocation.trim(),
    referral_source: 'website-cart',
    referral_detail: input.customer.notes.trim() || null,
    package_id: input.items.map((item) => item.id).join(','),
    package_title: packageTitle,
    table_tier: null,
    composites_count: null,
    sponge_count: null,
    include_delivery: input.deliveryPrice > 0,
    upgrades: input.items.map((item) => ({
      description: item.title,
      price: item.price,
      quantity: item.quantity
    })),
    base_price: input.subtotal,
    upgrades_total: 0,
    delivery_price: input.deliveryPrice,
    coupon_code: null,
    coupon_discount: 0,
    total_price: input.totalPrice,
    groom_sign_date: null,
    bride_sign_date: null,
    groom_signature_path: null,
    bride_signature_path: null,
    status: 'new',
    order_source: 'website-cart',
    internal_notes: input.customer.notes.trim() || null,
    admin_discount: 0
  });

  if (error) throw error;
  return { id };
}
