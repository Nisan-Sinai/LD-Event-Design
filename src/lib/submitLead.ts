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

  const lead = {
    id: data.id as string,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    estimatedEventDate: input.estimatedEventDate
  };

  const { error: notifyError } = await supabase.functions.invoke('send-lead-email', { body: { lead } });
  if (notifyError) throw notifyError;

  return { id: data.id as string };
}
