// Supabase Edge Function — שולחת שני מיילים על כל הזמנה חדשה דרך Gmail SMTP:
//   1) ללירון (בעלת האתר) — כל פרטי ההזמנה + קישורים לחתימות
//   2) ללקוח — אישור הזמנה
//
// מופעלת ע"י Database Webhook על INSERT לטבלת public.orders.
//
// פריסה:  node scripts/deploy-function.cjs send-order-emails supabase/functions/send-order-emails/index.ts
// סודות:  GMAIL_USER, GMAIL_APP_PASSWORD, OWNER_EMAIL

import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

interface OrderRecord {
  id: string;
  created_at: string;
  groom_name: string;
  bride_name: string;
  groom_phone: string;
  bride_phone: string;
  email: string;
  event_date: string | null;
  event_location: string | null;
  package_title: string | null;
  table_tier: number | null;
  composites_count: string | null;
  sponge_count: string | null;
  include_delivery: boolean;
  upgrades: { description: string; price: number }[];
  base_price: number;
  upgrades_total: number;
  delivery_price: number;
  total_price: number;
  groom_sign_date: string | null;
  bride_sign_date: string | null;
  groom_signature_path: string | null;
  bride_signature_path: string | null;
}

const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!;
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') ?? GMAIL_USER;
const FROM = `LD Event Design <${GMAIL_USER}>`;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
});

const ils = (n: number) => `₪${Number(n || 0).toLocaleString('he-IL')}`;

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from('signatures')
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 ימים
  return data?.signedUrl ?? null;
}

async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

function orderRows(o: OrderRecord): string {
  const upgrades = (o.upgrades ?? [])
    .map(u => `<tr><td>${u.description}</td><td style="text-align:left">${ils(u.price)}</td></tr>`)
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px" dir="rtl">
      <tr><td>חתן</td><td style="text-align:left"><b>${o.groom_name}</b> (${o.groom_phone})</td></tr>
      <tr><td>כלה</td><td style="text-align:left"><b>${o.bride_name}</b> (${o.bride_phone})</td></tr>
      <tr><td>אימייל</td><td style="text-align:left">${o.email}</td></tr>
      <tr><td>תאריך אירוע</td><td style="text-align:left">${o.event_date ?? '-'}</td></tr>
      <tr><td>מיקום</td><td style="text-align:left">${o.event_location ?? '-'}</td></tr>
      <tr><td>חבילה</td><td style="text-align:left">${o.package_title ?? '-'}${o.table_tier ? ` (${o.table_tier} שולחנות)` : ''}</td></tr>
      <tr><td>מחיר בסיס</td><td style="text-align:left">${ils(o.base_price)}</td></tr>
      ${upgrades}
      ${o.include_delivery ? `<tr><td>הובלה והרכבה</td><td style="text-align:left">${ils(o.delivery_price)}</td></tr>` : ''}
      <tr style="border-top:2px solid #B29259"><td><b>סה"כ לתשלום</b></td><td style="text-align:left"><b>${ils(o.total_price)}</b></td></tr>
    </table>`;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const o: OrderRecord = payload.record;
    if (!o) return new Response('no record', { status: 400 });

    const groomSig = await signedUrl(o.groom_signature_path);
    const brideSig = await signedUrl(o.bride_signature_path);

    const wrap = (title: string, body: string) => `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;border:1px solid #EAE3D2;border-radius:12px;overflow:hidden" dir="rtl">
        <div style="background:#B29259;color:#fff;padding:16px 20px">
          <h2 style="margin:0">LD Event Design</h2>
          <div style="font-size:12px;opacity:.9">Making all dreams come true</div>
        </div>
        <div style="padding:20px;color:#333">
          <h3 style="color:#8C6D3F">${title}</h3>
          ${body}
        </div>
      </div>`;

    // 1) מייל ללירון (בעלת האתר)
    const sigLinks = `
      <p style="font-size:13px">חתימות:
        ${groomSig ? `<a href="${groomSig}">חתימת חתן</a>` : 'חתן: -'} |
        ${brideSig ? `<a href="${brideSig}">חתימת כלה</a>` : 'כלה: -'}
      </p>`;
    await sendEmail(
      OWNER_EMAIL,
      `הזמנה חדשה: ${o.groom_name} & ${o.bride_name} — ${ils(o.total_price)}`,
      wrap('התקבלה הזמנה חדשה 🎉', orderRows(o) + sigLinks)
    );

    // 2) מייל אישור ללקוח
    await sendEmail(
      o.email,
      'אישור הזמנה — LD Event Design',
      wrap(
        `שלום ${o.groom_name} ו${o.bride_name}, תודה על הזמנתכם! 💐`,
        `<p>קיבלנו את ההזמנה שלכם ונחזור אליכם בהקדם. להלן סיכום:</p>${orderRows(o)}
         <p style="font-size:13px;color:#888">לכל שאלה ניתן לפנות אלינו בטלפון 054-5740423.</p>`
      )
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
