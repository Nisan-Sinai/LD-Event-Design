-- ============================================================
-- LD Event Design — סכמת בסיס הנתונים
-- הריצו את הקובץ הזה ב-Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) טבלת ההזמנות -------------------------------------------------
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),

  -- פרטי החתן והכלה
  groom_name            text not null,
  bride_name            text not null,
  groom_phone           text not null,
  bride_phone           text not null,
  email                 text not null,

  -- פרטי האירוע
  event_date            date,
  event_location        text,
  referral_source       text,
  referral_detail       text,

  -- החבילה הנבחרת
  package_id            text,
  package_title         text,
  table_tier            int,
  composites_count      text,
  sponge_count          text,

  -- תוספות והובלה
  include_delivery      boolean not null default false,
  upgrades              jsonb   not null default '[]'::jsonb,

  -- פירוט כספי
  base_price            numeric not null default 0,
  upgrades_total        numeric not null default 0,
  delivery_price        numeric not null default 0,
  coupon_code           text,
  coupon_discount       numeric not null default 0,
  total_price           numeric not null default 0,

  -- חתימות
  groom_sign_date       date,
  bride_sign_date       date,
  groom_signature_path  text,
  bride_signature_path  text,

  -- ניהול
  status                text not null default 'new'
);

-- 2) הפעלת Row Level Security -----------------------------------
alter table public.orders enable row level security;

-- מתיר לטופס הציבורי (anon) להוסיף הזמנות בלבד.
-- אין מדיניות SELECT/UPDATE/DELETE ל-anon, ולכן קריאה אפשרית רק
-- דרך הדשבורד של Supabase או service role.
drop policy if exists "allow anonymous insert" on public.orders;
create policy "allow anonymous insert"
  on public.orders
  for insert
  to anon
  with check (true);

-- 3) Storage לתמונות החתימה (bucket פרטי) -----------------------
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- מתיר ל-anon להעלות קבצים ל-bucket הזה בלבד (לא לקרוא/למחוק).
drop policy if exists "allow anon upload signatures" on storage.objects;
create policy "allow anon upload signatures"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'signatures');

-- 4) מיגרציות לטבלאות קיימות (בטוח להריץ שוב ושוב) -----------------
-- קוד קופון והנחת ₪500 לשדרוג העיצוב
alter table public.orders add column if not exists coupon_code     text;
alter table public.orders add column if not exists coupon_discount numeric not null default 0;

-- "איך הגעת אלינו" + שם האולם/הממליץ (סעיף הפניה)
alter table public.orders add column if not exists referral_source text;
alter table public.orders add column if not exists referral_detail text;
