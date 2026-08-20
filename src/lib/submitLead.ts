import { isSupabaseConfigured, supabase } from './supabase';

export interface WebsiteLeadInput {
  fullName: string;
  phone: string;
  email: string;
  estimatedEventDate: string;
  pageUrl?: string;
  userAgent?: string;
}

export async function submitLead(input: WebsiteLeadInput): Promise<{ id: string }> {
  const fallbackId = crypto.randomUUID();
  if (!isSupabaseConfigured) return { id: fallbackId };

  const { data, error } = await supabase
    .from('website_leads')
    .insert({
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim() || null,
      estimated_event_date: input.estimatedEventDate || null,
      source: 'homepage-popup',
      page_url: input.pageUrl ?? window.location.href,
      user_agent: input.userAgent ?? window.navigator.userAgent
    })
    .select('id')
    .single();

  if (error) throw error;

  // Email delivery is intentionally not callable by the browser. The database
  // INSERT trigger issues a short-lived one-time dispatch token and invokes the
  // internal Edge Function with that token.
  return { id: data.id as string };
}
