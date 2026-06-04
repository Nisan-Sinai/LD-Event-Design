import { supabase } from './supabase';

export interface OrderUpgrade {
  description: string;
  price: number;
}

export interface OrderPayload {
  groomName: string;
  brideName: string;
  groomPhone: string;
  bridePhone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  packageId: string;
  packageTitle: string;
  tableTier: number | null;
  compositesCount: string;
  spongeCount: string;
  includeDelivery: boolean;
  upgrades: OrderUpgrade[];
  basePrice: number;
  upgradesTotal: number;
  deliveryPrice: number;
  couponCode: string;
  couponDiscount: number;
  totalPrice: number;
  groomSignDate: string;
  brideSignDate: string;
}

// המרת dataURL (מהקנבס) ל-Blob להעלאה ל-Storage
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * מעלה את תמונות החתימה ל-Supabase Storage וכותב שורת הזמנה חדשה.
 * הוספת השורה מפעילה Webhook → Edge Function ששולחת את שני המיילים.
 */
export async function submitOrder(
  payload: OrderPayload,
  groomSignatureDataUrl: string,
  brideSignatureDataUrl: string
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const groomPath = `${id}/groom.png`;
  const bridePath = `${id}/bride.png`;

  const groomUpload = await supabase.storage
    .from('signatures')
    .upload(groomPath, dataUrlToBlob(groomSignatureDataUrl), { contentType: 'image/png' });
  if (groomUpload.error) throw groomUpload.error;

  const brideUpload = await supabase.storage
    .from('signatures')
    .upload(bridePath, dataUrlToBlob(brideSignatureDataUrl), { contentType: 'image/png' });
  if (brideUpload.error) throw brideUpload.error;

  const { error } = await supabase.from('orders').insert({
    id,
    groom_name: payload.groomName,
    bride_name: payload.brideName,
    groom_phone: payload.groomPhone,
    bride_phone: payload.bridePhone,
    email: payload.email,
    event_date: payload.eventDate || null,
    event_location: payload.eventLocation,
    package_id: payload.packageId,
    package_title: payload.packageTitle,
    table_tier: payload.tableTier,
    composites_count: payload.compositesCount || null,
    sponge_count: payload.spongeCount || null,
    include_delivery: payload.includeDelivery,
    upgrades: payload.upgrades,
    base_price: payload.basePrice,
    upgrades_total: payload.upgradesTotal,
    delivery_price: payload.deliveryPrice,
    coupon_code: payload.couponCode || null,
    coupon_discount: payload.couponDiscount,
    total_price: payload.totalPrice,
    groom_sign_date: payload.groomSignDate || null,
    bride_sign_date: payload.brideSignDate || null,
    groom_signature_path: groomPath,
    bride_signature_path: bridePath
  });
  if (error) throw error;

  return { id };
}
