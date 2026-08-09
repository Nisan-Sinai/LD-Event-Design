import { isSupabaseConfigured, supabase } from './supabase';
import { signatureKind, type DigitalSignature } from './signatures';

export interface CartOrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface CartCustomerDetails {
  eventType: string;
  fullName: string;
  additionalName: string;
  phone: string;
  additionalPhone: string;
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
  includeDelivery: boolean;
  deliveryPrice: number;
  totalPrice: number;
  signatures: {
    primary: DigitalSignature;
    secondary: DigitalSignature | null;
  };
  brandLogoUrl: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) throw new Error('Invalid signature image');
  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mimeMatch = header.match(/^data:(image\/png);base64$/);
  if (!mimeMatch) throw new Error('Unsupported signature image');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeMatch[1] });
}

async function uploadSignature(orderId: string, role: 'primary' | 'secondary', signature: DigitalSignature | null): Promise<string | null> {
  if (!signature?.dataUrl) return null;
  const path = orderId + '/' + role + '.png';
  const { error } = await supabase.storage
    .from('signatures')
    .upload(path, dataUrlToBlob(signature.dataUrl), { contentType: 'image/png', upsert: false });
  if (error) throw error;
  return path;
}

export async function submitCartOrder(input: CartOrderInput): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  if (!isSupabaseConfigured) return { id };

  const packageTitle = input.items
    .map((item) => item.title + (item.quantity > 1 ? ' × ' + item.quantity : ''))
    .join(' | ');

  const [primarySignaturePath, secondarySignaturePath] = await Promise.all([
    uploadSignature(id, 'primary', input.signatures.primary),
    uploadSignature(id, 'secondary', input.signatures.secondary)
  ]);

  const quoteMetadata = {
    eventType: input.customer.eventType,
    customColors: input.preferences.customColors,
    customRequest: input.preferences.customRequest,
    customerNotes: input.customer.notes,
    primarySigner: input.signatures.primary.typedName.trim() || input.customer.fullName.trim(),
    primarySignatureKind: signatureKind(input.signatures.primary),
    secondarySigner: input.signatures.secondary?.typedName.trim() || input.customer.additionalName.trim(),
    secondarySignatureKind: input.signatures.secondary ? signatureKind(input.signatures.secondary) : 'none',
    brandLogoUrl: input.brandLogoUrl,
    quoteOnly: true,
    noPaymentCollected: true,
    deliveryIncluded: input.includeDelivery,
    policyAcceptedAt: new Date().toISOString(),
    policyVersion: '2026-08-09'
  };

  const { error } = await supabase.from('orders').insert({
    id,
    groom_name: input.customer.fullName.trim(),
    bride_name: input.customer.additionalName.trim() || '-',
    groom_phone: input.customer.phone.trim(),
    bride_phone: input.customer.additionalPhone.trim() || input.customer.phone.trim(),
    email: input.customer.email.trim(),
    event_date: input.customer.eventDate || null,
    event_location: input.customer.eventLocation.trim(),
    referral_source: 'website-order-selection',
    referral_detail: JSON.stringify(quoteMetadata),
    package_id: input.items.map((item) => item.id).join(','),
    package_title: packageTitle,
    table_tier: null,
    composites_count: null,
    sponge_count: null,
    include_delivery: input.includeDelivery,
    upgrades: input.items.map((item) => ({
      description: item.title,
      price: item.price,
      quantity: item.quantity
    })),
    base_price: input.subtotal,
    upgrades_total: 0,
    delivery_price: input.deliveryPrice,
    coupon_code: input.preferences.couponApplied ? 'validated' : null,
    coupon_discount: 0,
    total_price: input.totalPrice,
    status: 'new',
    order_source: 'website-order-selection',
    internal_notes: JSON.stringify(quoteMetadata),
    admin_discount: 0,
    groom_sign_date: input.signatures.primary.signedAt || null,
    bride_sign_date: input.signatures.secondary?.signedAt || null,
    groom_signature_path: primarySignaturePath,
    bride_signature_path: secondarySignaturePath
  });

  if (error) throw error;
  return { id };
}
