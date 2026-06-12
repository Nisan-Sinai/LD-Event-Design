-- ============================================================
-- מיגרציית הרשאות/תפקידים ל-LD Event Design (פאזה F)
-- להריץ ב-Supabase → SQL Editor פעם אחת, אחרי הפעלת Email Auth.
-- ============================================================

-- 1) טבלת פרופילים + תפקיד מנהל
create table if not exists public.profiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  email     text,
  is_admin  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- כל משתמש רואה/מעדכן רק את הפרופיל שלו
drop policy if exists "profiles self read"  on public.profiles;
create policy "profiles self read" on public.profiles
  for select to authenticated using (id = auth.uid());

-- יצירת פרופיל אוטומטית בעת הרשמה
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- פונקציית עזר: האם המשתמש הנוכחי מנהל
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ➜ להפוך את לירון למנהל (להריץ אחרי שנרשמה):
-- update public.profiles set is_admin = true where email = 'luroni704@gmail.com';

-- 2) קישור הזמנות למשתמש.
--    ברירת המחדל auth.uid() ממלאת אוטומטית את מזהה המשתמש המחובר —
--    כך אין צורך לשנות את קוד שליחת ההזמנה, ושליחה של אורח (anon) תקבל null.
alter table public.orders add column if not exists user_id uuid references auth.users (id) default auth.uid();

-- 3) RLS להזמנות: לקוח רואה/יוצר את שלו, מנהל רואה הכול.
-- מחליפים את מדיניות האורח הקיימת ("allow anonymous insert" עם check true)
-- בגרסה בטוחה שמונעת זיוף user_id.
drop policy if exists "allow anonymous insert" on public.orders;
create policy "allow anonymous insert" on public.orders
  for insert to anon
  with check (user_id is null);

-- מחובר: משייך את ההזמנה לעצמו (user_id ממולא אוטומטית ב-default auth.uid())
drop policy if exists "orders insert own" on public.orders;
create policy "orders insert own" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());

-- צפייה: בעל ההזמנה או מנהל
drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
