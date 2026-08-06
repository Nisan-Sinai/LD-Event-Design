create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint admin_emails_lowercase check (email = lower(email))
);

alter table public.admin_emails enable row level security;
revoke all on table public.admin_emails from anon, authenticated;

insert into public.admin_emails (email)
values ('luroni704@gmail.com'), ('nisan.sinai5@gmail.com')
on conflict (email) do nothing;

insert into public.profiles (id, email, is_admin)
select id, email, true
from auth.users
where lower(email) in ('luroni704@gmail.com', 'nisan.sinai5@gmail.com')
on conflict (id) do update
set email = excluded.email,
    is_admin = true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
    or exists (
      select 1
      from public.admin_emails a
      where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  permanent_admin boolean;
begin
  select exists (
    select 1 from public.admin_emails a where a.email = lower(coalesce(new.email, ''))
  ) into permanent_admin;

  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, permanent_admin)
  on conflict (id) do update
  set email = excluded.email,
      is_admin = public.profiles.is_admin or excluded.is_admin;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "package images admin update" on storage.objects;
create policy "package images admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'package-images' and public.is_admin())
with check (bucket_id = 'package-images' and public.is_admin());

drop policy if exists "package images admin delete" on storage.objects;
create policy "package images admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'package-images' and public.is_admin());
