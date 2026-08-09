import { isSupabaseConfigured, supabase } from './supabase';

export async function validateCouponCode(code: string): Promise<boolean> {
  const normalized = code.trim();
  if (!normalized || !isSupabaseConfigured) return false;

  const { data, error } = await supabase.rpc('validate_coupon', { p_code: normalized });
  if (error) throw error;
  return data === true;
}
