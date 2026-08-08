// Supabase Edge Function — order and quote notifications.
// Triggered by public.notify_new_order() after INSERT into public.orders.
// Sends a styled summary document to the manager and, when supplied, to the customer.

import nodemailer from 'npm:nodemailer@6.9.16';

interface UpgradeLine {
  description: string;
  price: number;
  quantity?: number;
}

interface QuoteMetadata {
  palette?: string;
  customColors?: string;
  flowerColor?: string;
  balloonColor?: string;
  tableclothColor?: string;
  customRequest?: string;
  customerNotes?: string;
  quoteOnly?: boolean;
  noPaymentCollected?: boolean;
  policyAcceptedAt?: string;
  policyVersion?: string;
}

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
  upgrades: UpgradeLine[] | null;
  base_price: number;
  upgrades_total: number;
  delivery_price: number;
  coupon_code: string | null;
  coupon_discount: number;
  total_price: number;
  order_source?: string | null;
  referral_detail?: string | null;
  internal_notes?: string | null;
}

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') ?? GMAIL_USER;
const FROM = `LD Event Design <${GMAIL_USER}>`;

const GOOGLE_SA_EMAIL = Deno.env.get('GOOGLE_SA_EMAIL') ?? '';
const GOOGLE_SA_PRIVATE_KEY = (Deno.env.get('GOOGLE_SA_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const GOOGLE_CALENDAR_ID = Deno.env.get('GOOGLE_CALENDAR_ID') ?? '';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
});

const POLICY = [
  'במקרה של ביטול כוח עליון — מלחמה או מגפה — הסכום ששולם יועבר לזיכוי לתאריך חלופי על בסיס זמינות. במידה ולא יימצא תאריך מוסכם, לא יוחזרו ללקוח/ה 50% מסכום העסקה הכולל.',
  'במקרה של כל ביטול אחר לא יוחזר ללקוח כל תשלום והלקוח יחויב במלוא תשלום העסקה.',
  'במידה ולא יימצא תאריך חלופי, הלקוח/ה יוכל להגיע לקחת את הציוד שהוזמן לאירוע בתשלום מלא של העסקה, ללא הובלה והרכבה ובכפוף להשארת פיקדון עד להחזרת הציוד.',
  'ניתן לעדכן תוספות קלות בכמויות ההזמנה עד 30 ימי עסקים לפני מועד האירוע.',
  'האחריות על הציוד בזמן האירוע היא על הלקוח/ה.',
  'יתרת התשלום תועבר בהעברה בנקאית כאישור, כשבוע לפני מועד האירוע.'
];

const ils = (value: number) => `₪${Number(value || 0).toLocaleString('he-IL')}`;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character] ?? character);
}

function parseMetadata(order: OrderRecord): QuoteMetadata {
  for (const raw of [order.internal_notes, order.referral_detail]) {
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as QuoteMetadata;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Older records may contain plain text. Ignore it and continue.
    }
  }
  return {};
}

function isQuoteRequest(order: OrderRecord, metadata: QuoteMetadata): boolean {
  return order.order_source === 'website-quote-builder' || metadata.quoteOnly === true;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments: Array<{ filename: string; content: string; contentType: string }> = []
) {
  await transporter.sendMail({ from: FROM, to, subject, html, attachments });
}

function detailRow(label: string, value: string, emphasis = false): string {
  return `<tr>
    <td style="padding:10px 8px;border-bottom:1px solid #F0E6DF;color:#76695F">${escapeHtml(label)}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #F0E6DF;text-align:left;color:#2C2C2C;${emphasis ? 'font-weight:800;font-size:17px;color:#B8860B' : ''}">${value}</td>
  </tr>`;
}

function orderRows(order: OrderRecord, metadata: QuoteMetadata, quoteOnly: boolean): string {
  const upgrades = (order.upgrades ?? [])
    .map((line) => {
      const quantity = Math.max(1, Number(line.quantity ?? 1));
      const lineTotal = Number(line.price || 0) * quantity;
      const description = `${escapeHtml(line.description)}${quantity > 1 ? ` × ${quantity}` : ''}`;
      return detailRow(description, escapeHtml(ils(lineTotal)));
    })
    .join('');

  const people = order.bride_name && order.bride_name !== '-'
    ? `${escapeHtml(order.groom_name)} &amp; ${escapeHtml(order.bride_name)}`
    : escapeHtml(order.groom_name);

  const paletteRows = quoteOnly
    ? [
        metadata.palette ? detailRow('פלטת צבעים', escapeHtml(metadata.palette)) : '',
        metadata.customColors ? detailRow('גוונים מדויקים', escapeHtml(metadata.customColors)) : '',
        metadata.flowerColor ? detailRow('גוון לפרחים', escapeHtml(metadata.flowerColor)) : '',
        metadata.balloonColor ? detailRow('גוון לבלונים', escapeHtml(metadata.balloonColor)) : '',
        metadata.tableclothColor ? detailRow('גוון למפות וטקסטיל', escapeHtml(metadata.tableclothColor)) : '',
        metadata.customRequest ? detailRow('בקשה עיצובית אישית', escapeHtml(metadata.customRequest)) : '',
        metadata.customerNotes ? detailRow('הערות נוספות', escapeHtml(metadata.customerNotes)) : ''
      ].join('')
    : '';

  const couponRow = order.coupon_code
    ? detailRow(
        'קוד קופון',
        order.coupon_code === 'מתנה'
          ? '<b style="color:#18794E">מתנה — מתנה מפתיעה מחכה בשיחת ההתאמה :)</b>'
          : escapeHtml(order.coupon_code)
      )
    : '';

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px" dir="rtl">
      ${detailRow('שם הלקוח/ה', `<b>${people}</b>`)}
      ${detailRow('טלפון', escapeHtml(order.groom_phone || order.bride_phone || '-'))}
      ${detailRow('אימייל', escapeHtml(order.email || '-'))}
      ${detailRow('תאריך אירוע', escapeHtml(order.event_date ?? '-'))}
      ${detailRow('מיקום האירוע', escapeHtml(order.event_location ?? '-'))}
      ${detailRow(quoteOnly ? 'הבחירות שנוספו להצעה' : 'חבילה', escapeHtml(order.package_title ?? '-'))}
      ${upgrades}
      ${paletteRows}
      ${couponRow}
      ${!quoteOnly && order.include_delivery ? detailRow('הובלה והרכבה', escapeHtml(ils(order.delivery_price))) : ''}
      ${!quoteOnly && order.coupon_discount ? detailRow(`הטבת קופון (${order.coupon_code ?? ''})`, `−${escapeHtml(ils(order.coupon_discount))}`) : ''}
      ${detailRow(quoteOnly ? 'אומדן נוכחי להצעת המחיר' : 'סה״כ לתשלום', escapeHtml(ils(order.total_price)), true)}
    </table>`;
}

function policySection(): string {
  return `
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#FAF6F0;border:1px solid #E8C5B8">
      <h3 style="margin:0 0 12px;color:#2C2C2C;font-size:16px">מדיניות ביטולים, שינויים ואחריות</h3>
      <ol style="margin:0;padding-right:20px;color:#5E5752;font-size:12px;line-height:1.75">
        ${POLICY.map((item) => `<li style="margin-bottom:7px">${escapeHtml(item)}</li>`).join('')}
      </ol>
    </div>`;
}

function quoteNotice(): string {
  return `
    <div style="margin:18px 0;padding:16px;border-radius:18px;background:linear-gradient(135deg,#FFFDFC,#F4E3E3);border:1px solid #E8C5B8;color:#2C2C2C;line-height:1.7">
      <b>✨ הרכבת החבילה באתר היא לקבלת הצעת מחיר בלבד ללא שום תשלום או התחייבות.</b><br>
      לאחר שליחת הפרטים ניפגש לשיחת התאמה אישית, ונרכיב יחד את עיצוב החלומות שלכם!
    </div>`;
}

function wrap(title: string, body: string, quoteOnly: boolean): string {
  return `<!doctype html>
    <html lang="he" dir="rtl">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:24px;background:#F5F1EC;font-family:Arial,Helvetica,sans-serif;color:#2C2C2C">
        <div style="max-width:680px;margin:0 auto;border:1px solid #E8C5B8;border-radius:26px;overflow:hidden;background:#FDFBF7;box-shadow:0 20px 60px rgba(44,44,44,.12)">
          <div style="background:linear-gradient(135deg,#2C2C2C,#604C3F);color:#fff;padding:26px 28px">
            <div style="font-size:11px;letter-spacing:3px;color:#E8C5B8">LD EVENT DESIGN</div>
            <h1 style="margin:8px 0 0;font-size:26px">${escapeHtml(title)}</h1>
            <div style="margin-top:5px;font-size:12px;color:rgba(255,255,255,.65)">Making all dreams come true</div>
          </div>
          <div style="padding:26px 28px">
            ${quoteOnly ? quoteNotice() : ''}
            ${body}
          </div>
        </div>
      </body>
    </html>`;
}

function summaryDocument(order: OrderRecord, metadata: QuoteMetadata, quoteOnly: boolean): string {
  const title = quoteOnly ? 'סיכום בקשה להצעת מחיר' : 'סיכום הזמנה';
  return wrap(
    title,
    `<p style="font-size:13px;color:#76695F">מספר פנייה: ${escapeHtml(order.id)}</p>
     ${orderRows(order, metadata, quoteOnly)}
     ${policySection()}
     <p style="margin-top:20px;font-size:12px;color:#8A817A">לכל שאלה: 054-5740423</p>`,
    quoteOnly
  );
}

// ---------- Google Calendar (optional service account integration) ----------
const textEncoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) buffer[index] = binary.charCodeAt(index);
  return buffer.buffer;
}

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
  const unsigned = `${b64url(textEncoder.encode(JSON.stringify(header)))}.${b64url(textEncoder.encode(JSON.stringify(claim)))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(GOOGLE_SA_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textEncoder.encode(unsigned));
  const assertion = `${unsigned}.${b64url(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await response.json();
  if (!data.access_token) throw new Error(`Google token error: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

async function createCalendarEvent(order: OrderRecord, quoteOnly: boolean): Promise<void> {
  if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !GOOGLE_CALENDAR_ID || !order.event_date) return;

  const token = await getGoogleAccessToken();
  const start = order.event_date;
  const end = new Date(new Date(order.event_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const description = [
    `לקוח/ה: ${order.groom_name}${order.bride_name && order.bride_name !== '-' ? ` & ${order.bride_name}` : ''}`,
    `טלפון: ${order.groom_phone || order.bride_phone}`,
    `אימייל: ${order.email}`,
    order.package_title ? `${quoteOnly ? 'בחירות להצעה' : 'חבילה'}: ${order.package_title}` : '',
    `${quoteOnly ? 'אומדן' : 'סה״כ לתשלום'}: ${ils(order.total_price)}`
  ].filter(Boolean).join('\n');

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `${quoteOnly ? 'פניית הצעת מחיר' : 'אירוע'}: ${order.groom_name}${order.package_title ? ` — ${order.package_title}` : ''}`,
        description,
        location: order.event_location ?? undefined,
        start: { date: start },
        end: { date: end }
      })
    }
  );
  if (!response.ok) throw new Error(`Google Calendar insert failed: ${await response.text()}`);
}

Deno.serve(async (request) => {
  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !OWNER_EMAIL) {
      throw new Error('Email secrets are not configured');
    }

    const payload = await request.json();
    const order = payload?.record as OrderRecord | undefined;
    if (!order?.id) return new Response('no record', { status: 400 });

    const metadata = parseMetadata(order);
    const quoteOnly = isQuoteRequest(order, metadata);
    const document = summaryDocument(order, metadata, quoteOnly);
    const attachment = [{
      filename: `${quoteOnly ? 'ld-event-design-quote' : 'ld-event-design-order'}-${order.id}.html`,
      content: document,
      contentType: 'text/html; charset=utf-8'
    }];

    await sendEmail(
      OWNER_EMAIL,
      quoteOnly
        ? `בקשה חדשה להצעת מחיר: ${order.groom_name} — ${ils(order.total_price)}`
        : `הזמנה חדשה: ${order.groom_name} & ${order.bride_name} — ${ils(order.total_price)}`,
      wrap(
        quoteOnly ? 'התקבלה בקשה חדשה להצעת מחיר ✨' : 'התקבלה הזמנה חדשה 🎉',
        `${orderRows(order, metadata, quoteOnly)}${policySection()}`,
        quoteOnly
      ),
      attachment
    );

    if (order.email && order.email.includes('@')) {
      try {
        await sendEmail(
          order.email,
          quoteOnly ? 'קיבלנו את בקשת הצעת המחיר — LD Event Design' : 'אישור הזמנה — LD Event Design',
          wrap(
            quoteOnly ? `שלום ${order.groom_name}, הבקשה שלכם התקבלה באהבה` : `שלום ${order.groom_name} ו${order.bride_name}, תודה על הזמנתכם!`,
            quoteOnly
              ? `<p style="line-height:1.7">קיבלנו את הבחירות והפרטים שלכם. מצורף מסמך סיכום מעוצב, וניצור איתכם קשר לשיחת התאמה אישית.</p>${orderRows(order, metadata, true)}${policySection()}<p style="font-size:13px;color:#76695F">לכל שאלה: 054-5740423</p>`
              : `<p>קיבלנו את ההזמנה ונחזור אליכם בהקדם. להלן הסיכום:</p>${orderRows(order, metadata, false)}${policySection()}<p style="font-size:13px;color:#76695F">לכל שאלה: 054-5740423</p>`,
            quoteOnly
          ),
          attachment
        );
      } catch (mailError) {
        console.error('customer confirmation email failed:', mailError);
      }
    }

    try {
      await createCalendarEvent(order, quoteOnly);
    } catch (calendarError) {
      console.error('Google Calendar sync failed:', calendarError);
    }

    return new Response(JSON.stringify({ ok: true, quoteOnly }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('send-order-emails failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'notification_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
