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

/** שולף הזמנות. עם userId — רק של אותו משתמש (לקוח); בלי — כל ההזמנות (מנהל). */
export async function fetchOrders(opts: { userId?: string } = {}): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('orders').select(COLS).order('created_at', { ascending: false });
  if (opts.userId) query = query.eq('user_id', opts.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}
