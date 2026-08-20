import nodemailer from 'npm:nodemailer@9.0.5';
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

interface WebsiteLeadRecord {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  estimated_event_date: string | null;
}

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') ?? GMAIL_USER;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  disableFileAccess: true,
  disableUrlAccess: true
});

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char] ?? char);
}

function safeSubject(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function authenticateDispatch(payload: unknown): Promise<WebsiteLeadRecord | null> {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;
  if (!isUuid(body.token) || !isUuid(body.record_id)) return null;

  const { data: consumed, error: consumeError } = await admin.rpc('consume_webhook_dispatch', {
    p_token: body.token,
    p_kind: 'lead',
    p_record_id: body.record_id
  });
  if (consumeError || consumed !== true) return null;

  const { data, error } = await admin
    .from('website_leads')
    .select('id,full_name,phone,email,estimated_event_date')
    .eq('id', body.record_id)
    .single();
  if (error || !data) return null;
  return data as WebsiteLeadRecord;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > 64 * 1024) {
    return json({ error: 'payload_too_large' }, 413);
  }

  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !OWNER_EMAIL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required server secrets are not configured');
    }

    const payload = await request.json();
    const lead = await authenticateDispatch(payload);
    if (!lead) return json({ error: 'unauthorized_dispatch' }, 401);

    const cleanName = escapeHtml(lead.full_name.trim());
    const cleanPhone = escapeHtml(lead.phone.trim());
    const cleanEmail = escapeHtml((lead.email ?? '').trim());
    const cleanDate = escapeHtml((lead.estimated_event_date ?? '').trim());

    const html = `
      <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#FDFBF7;border:1px solid #E8C5B8;border-radius:22px;overflow:hidden;color:#2C2C2C">
        <div style="background:linear-gradient(135deg,#B8860B,#D4AF37);padding:24px;color:white">
          <div style="font-size:13px;letter-spacing:2px">LD EVENT DESIGN</div>
          <h1 style="margin:8px 0 0;font-size:24px">ליד חדש מהאתר ✨</h1>
        </div>
        <div style="padding:24px">
          <p><b>שם מלא:</b> ${cleanName}</p>
          <p><b>טלפון:</b> ${cleanPhone}</p>
          <p><b>אימייל:</b> ${cleanEmail || 'לא הוזן'}</p>
          <p><b>תאריך אירוע משוער:</b> ${cleanDate || 'לא הוזן'}</p>
          <p style="margin-top:24px;color:#76695F;font-size:13px">מספר ליד: ${escapeHtml(lead.id)}</p>
        </div>
      </div>`;

    await transporter.sendMail({
      from: `LD Event Design <${GMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: `ליד חדש מהאתר — ${safeSubject(lead.full_name)}`,
      html
    });

    return json({ ok: true });
  } catch (error) {
    console.error('send-lead-email failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'notification_failed' }, 500);
  }
});
