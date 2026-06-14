import { supabase, isSupabaseConfigured } from './supabase';

export interface OrderRow {
  id: string;
  created_at: string;
  groom_name: string;
  bride_name: string;
  email: string;
  event_date: string | null;
  event_location: string | null;
  package_title: string | null;
  total_price: number;
  status: string;
}

const COLS =
  'id,created_at,groom_name,bride_name,email,event_date,event_location,package_title,total_price,status';

/** הזמנה מלאה — כל העמודות (לתצוגת הפרטים בדף הניהול / האזור האישי). */
export interface OrderDetail extends OrderRow {
  groom_phone: string;
  bride_phone: string;
  package_id: string | null;
  table_tier: number | null;
  composites_count: string | null;
  sponge_count: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  include_delivery: boolean;
  upgrades: { description: string; price: number }[];
  base_price: number;
  upgrades_total: number;
  delivery_price: number;
  coupon_code: string | null;
  coupon_discount: number;
  order_source: string | null;
  received_by: string | null;
  internal_notes: string | null;
  admin_discount: number;
  groom_sign_date: string | null;
  bride_sign_date: string | null;
  groom_signature_path: string | null;
  bride_signature_path: string | null;
}

/** שולף הזמנות. עם userId — רק של אותו משתמש (לקוח); בלי — כל ההזמנות (מנהל). */
export async function fetchOrders(opts: { userId?: string } = {}): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('orders').select(COLS).order('created_at', { ascending: false });
  if (opts.userId) query = query.eq('user_id', opts.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

/** שולף הזמנה בודדת עם כל פרטיה. */
export async function fetchOrderById(id: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) throw error;
  return data as OrderDetail;
}

/** מפיק כתובת חתומה זמנית לתמונת חתימה (bucket פרטי). מחזיר null אם אין גישה. */
export async function signatureUrl(path: string | null): Promise<string | null> {
  if (!isSupabaseConfigured || !path) return null;
  const { data, error } = await supabase.storage.from('signatures').createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
