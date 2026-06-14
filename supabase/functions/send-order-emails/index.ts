// Supabase Edge Function — על כל הזמנה חדשה:
//   1) שולחת מייל ללירון (בעלת האתר) — כל פרטי ההזמנה + קישורים לחתימות
//   2) שולחת מייל אישור ללקוח
//   3) מוסיפה את האירוע ליומן Google של לירון (אם הוגדרו סודות Google)
//
// מופעלת ע"י Database Webhook על INSERT לטבלת public.orders.
//
// פריסה:  node scripts/deploy-function.cjs send-order-emails supabase/functions/send-order-emails/index.ts
// סודות:  GMAIL_USER, GMAIL_APP_PASSWORD, OWNER_EMAIL
//         (אופציונלי ליומן) GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_CALENDAR_ID

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
  coupon_code: string | null;
  coupon_discount: number;
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

// סודות יומן Google (אופציונלי) — חשבון שירות שמשתף את היומן של לירון
const GOOGLE_SA_EMAIL = Deno.env.get('GOOGLE_SA_EMAIL') ?? '';
// המפתח הפרטי נשמר לרוב עם "\n" טקסטואלי — ממירים לשורות אמיתיות
const GOOGLE_SA_PRIVATE_KEY = (Deno.env.get('GOOGLE_SA_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const GOOGLE_CALENDAR_ID = Deno.env.get('GOOGLE_CALENDAR_ID') ?? '';

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
      <tr><td>בעל האירוע</td><td style="text-align:left"><b>${o.groom_name}</b> (${o.groom_phone})</td></tr>
      <tr><td>בעלת האירוע</td><td style="text-align:left"><b>${o.bride_name}</b> (${o.bride_phone})</td></tr>
      <tr><td>אימייל</td><td style="text-align:left">${o.email}</td></tr>
      <tr><td>תאריך אירוע</td><td style="text-align:left">${o.event_date ?? '-'}</td></tr>
      <tr><td>מיקום</td><td style="text-align:left">${o.event_location ?? '-'}</td></tr>
      <tr><td>חבילה</td><td style="text-align:left">${o.package_title ?? '-'}${o.table_tier ? ` (${o.table_tier} שולחנות)` : ''}</td></tr>
      <tr><td>מחיר בסיס</td><td style="text-align:left">${ils(o.base_price)}</td></tr>
      ${upgrades}
      ${o.include_delivery ? `<tr><td>הובלה והרכבה</td><td style="text-align:left">${ils(o.delivery_price)}</td></tr>` : ''}
      ${o.coupon_discount ? `<tr><td>הטבת קופון (${o.coupon_code ?? ''})</td><td style="text-align:left">−${ils(o.coupon_discount)}</td></tr>` : ''}
      <tr style="border-top:2px solid #B29259"><td><b>סה"כ לתשלום</b></td><td style="text-align:left"><b>${ils(o.total_price)}</b></td></tr>
    </table>`;
}

// ---------- יומן Google (חשבון שירות + JWT) ----------
const textEncoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// מחליף את ה-JWT של חשבון השירות ב-access token עם הרשאת כתיבה ליומן
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: GOOGLE_SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const unsigned =
    `${b64url(textEncoder.encode(JSON.stringify(header)))}.` +
    `${b64url(textEncoder.encode(JSON.stringify(claim)))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(GOOGLE_SA_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textEncoder.encode(unsigned));
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Google token error: ' + JSON.stringify(data));
  return data.access_token as string;
}

// מוסיף את האירוע ליומן של לירון (אירוע "כל היום" בתאריך האירוע)
async function createCalendarEvent(o: OrderRecord): Promise<void> {
  if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) return; // לא הוגדר — דילוג
  if (!o.event_date) return;

  const token = await getGoogleAccessToken();
  const start = o.event_date; // YYYY-MM-DD
  const end = new Date(new Date(o.event_date).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const description = [
    `בעל האירוע: ${o.groom_name} (${o.groom_phone})`,
    `בעלת האירוע: ${o.bride_name} (${o.bride_phone})`,
    `אימייל: ${o.email}`,
    o.package_title ? `חבילה: ${o.package_title}${o.table_tier ? ` (${o.table_tier} שולחנות)` : ''}` : '',
    `סה"כ לתשלום: ${ils(o.total_price)}`
  ].filter(Boolean).join('\n');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `אירוע: ${o.groom_name} ו${o.bride_name}${o.package_title ? ` — ${o.package_title}` : ''}`,
        description,
        location: o.event_location ?? undefined,
        start: { date: start },
        end: { date: end }
      })
    }
  );
  if (!res.ok) throw new Error('Google Calendar insert failed: ' + (await res.text()));
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
        ${groomSig ? `<a href="${groomSig}">חתימת בעל האירוע</a>` : 'בעל האירוע: -'} |
        ${brideSig ? `<a href="${brideSig}">חתימת בעלת האירוע</a>` : 'בעלת האירוע: -'}
      </p>`;
    await sendEmail(
      OWNER_EMAIL,
      `הזמנה חדשה: ${o.groom_name} & ${o.bride_name} — ${ils(o.total_price)}`,
      wrap('התקבלה הזמנה חדשה 🎉', orderRows(o) + sigLinks)
    );

    // 2) מייל אישור ללקוח — רק אם קיים אימייל תקין (הזמנת מנהל יכולה להיות בלי),
    //    וכשל בשליחה לא מפיל את הפונקציה ולא חוסם את סנכרון היומן.
    if (o.email && o.email.includes('@')) {
      try {
        await sendEmail(
          o.email,
          'אישור הזמנה — LD Event Design',
          wrap(
            `שלום ${o.groom_name} ו${o.bride_name}, תודה על הזמנתכם! 💐`,
            `<p>קיבלנו את ההזמנה שלכם ונחזור אליכם בהקדם. להלן סיכום:</p>${orderRows(o)}
             <p style="font-size:13px;color:#888">לכל שאלה ניתן לפנות אלינו בטלפון 054-5740423.</p>`
          )
        );
      } catch (mailErr) {
        console.error('customer confirmation email failed:', mailErr);
      }
    }

    // 3) הוספת האירוע ליומן Google של לירון (לא מפיל את הפונקציה אם נכשל)
    try {
      await createCalendarEvent(o);
    } catch (calErr) {
      console.error('Google Calendar sync failed:', calErr);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
