# הקמת שמירת נתונים + מיילים (Supabase + Resend)

האפליקציה עובדת גם בלי ההקמה הזו (פשוט תדפיס בלי לשמור). כדי להפעיל שמירה ב-DB
ושליחת מיילים — בצעו את השלבים הבאים פעם אחת.

## חלק א׳ — Supabase (בסיס נתונים + אחסון)

1. היכנסו ל-https://supabase.com והקימו פרויקט חדש (בחרו אזור קרוב, למשל Frankfurt).
2. **SQL Editor** → New query → הדביקו את כל התוכן של [supabase/schema.sql](supabase/schema.sql) → **Run**.
   זה יוצר את טבלת `orders`, את ה-bucket `signatures`, ואת מדיניות ההרשאות.
3. **Project Settings → API** — העתיקו:
   - `Project URL`
   - `anon public` key
4. בתיקיית הפרויקט: העתיקו את `.env.example` ל-`.env` ומלאו:
   ```
   VITE_SUPABASE_URL=...        ← Project URL
   VITE_SUPABASE_ANON_KEY=...   ← anon public key
   ```
5. הפעילו מחדש את `npm run dev` (שינוי env דורש הפעלה מחדש).

➡️ בשלב זה כל הזמנה כבר נשמרת. תוכלו לראות אותן ב-Supabase תחת **Table Editor → orders**.

## חלק ב׳ — Resend (שליחת מיילים)

1. היכנסו ל-https://resend.com → צרו חשבון → **API Keys** → צרו מפתח.
2. **כתובת שולח:** לבדיקות אפשר להשתמש ב-`onboarding@resend.dev`. לשליחה אמיתית
   מומלץ לאמת דומיין (Domains → Add Domain) ולשלוח מ-`orders@yourdomain.com`.

## חלק ג׳ — Edge Function (מחבר בין השניים)

צריך את ה-Supabase CLI (https://supabase.com/docs/guides/cli).

```bash
supabase login
supabase link --project-ref <PROJECT_REF>        # ה-ref מה-URL של הפרויקט

# הגדרת סודות (לא נחשפים בקליינט):
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set OWNER_EMAIL=liron@example.com    # המייל של לירון
supabase secrets set FROM_EMAIL="LD Event Design <orders@yourdomain.com>"

# פריסת הפונקציה:
supabase functions deploy send-order-emails --no-verify-jwt
```

## חלק ד׳ — חיבור ה-Webhook (מפעיל מייל על כל הזמנה)

ב-Supabase: **Database → Webhooks → Create a new hook**
- Table: `orders`
- Events: `Insert`
- Type: **Supabase Edge Functions** → בחרו `send-order-emails`

זהו. מעכשיו כל הזמנה: נשמרת ב-DB → לירון מקבלת מייל עם כל הפרטים → הלקוח מקבל מייל אישור.

## חלק ה׳ — סנכרון ליומן Google של לירון (אופציונלי)

כשמוגדר, כל הזמנה חדשה נוספת אוטומטית כאירוע "כל היום" ביומן Google של לירון
(בתאריך האירוע, עם שם בעלי האירוע, טלפונים, החבילה והמיקום). אם הסודות לא הוגדרו —
הפונקציה פשוט מדלגת על השלב הזה.

1. **Google Cloud Console** (https://console.cloud.google.com) → צרו/בחרו פרויקט →
   **APIs & Services → Library** → הפעילו את **Google Calendar API**.
2. **APIs & Services → Credentials → Create credentials → Service account** → צרו חשבון שירות.
   פתחו אותו → **Keys → Add key → Create new key → JSON** והורידו את הקובץ.
   מתוך ה-JSON צריך: `client_email` ו-`private_key`.
3. **שיתוף היומן:** ב-Google Calendar של לירון → הגדרות היומן → **Share with specific people**
   → הוסיפו את ה-`client_email` של חשבון השירות עם הרשאת **"Make changes to events"**.
   את **Calendar ID** מעתיקים מאותו מסך (לרוב כתובת המייל של לירון, או מזהה `...@group.calendar.google.com`).
4. הגדירו את הסודות (ה-private key כולל שורות — שמרו את ה-`\n` כפי שהוא ב-JSON):
   ```bash
   supabase secrets set GOOGLE_SA_EMAIL="xxx@yyy.iam.gserviceaccount.com"
   supabase secrets set GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   supabase secrets set GOOGLE_CALENDAR_ID="liron@example.com"
   ```
5. פרסו מחדש את הפונקציה: `supabase functions deploy send-order-emails --no-verify-jwt`.

## בדיקה מהירה
מלאו טופס לדוגמה ולחצו "אישור והדפסת ההזמנה". בדקו:
- שורה חדשה ב-`orders`,
- מייל אצל לירון,
- מייל אישור בכתובת שהוזנה בטופס,
- אירוע חדש ביומן Google של לירון (אם הוגדר חלק ה׳).
אם משהו לא עובד — **Edge Functions → send-order-emails → Logs**.
