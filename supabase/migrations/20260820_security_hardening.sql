-- Security hardening: server-side validation, submission throttling,
-- one-time authenticated webhook dispatch, and storage restrictions.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keep the lead table definition in source control as well as in production.
create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text,
  estimated_event_date date,
  source text not null default 'homepage-popup',
  status text not null default 'new',
  user_agent text,
  page_url text
);

alter table public.website_leads enable row level security;

drop policy if exists "public can submit website leads" on public.website_leads;
create policy "public can submit website leads"
on public.website_leads for insert
to anon, authenticated
with check (
  length(btrim(full_name)) between 2 and 120
  and length(regexp_replace(phone, '[^0-9+]', '', 'g')) between 9 and 16
);

drop policy if exists "website_leads admin read" on public.website_leads;
create policy "website_leads admin read"
on public.website_leads for select
to authenticated
using ((select public.is_admin()));

-- One-time tokens make the mail Edge Functions internal webhook consumers,
-- even though verify_jwt remains false for database-originated pg_net calls.
create table if not exists private.webhook_dispatches (
  token uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order', 'lead')),
  record_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz
);

revoke all on private.webhook_dispatches from public, anon, authenticated;
create index if not exists webhook_dispatches_expiry_idx
  on private.webhook_dispatches (expires_at);

create or replace function private.issue_webhook_dispatch(p_kind text, p_record_id uuid)
returns uuid
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  issued_token uuid;
begin
  if p_kind not in ('order', 'lead') then
    raise exception 'invalid webhook kind';
  end if;

  delete from private.webhook_dispatches
  where expires_at < now() - interval '1 day';

  insert into private.webhook_dispatches (kind, record_id)
  values (p_kind, p_record_id)
  returning token into issued_token;

  return issued_token;
end;
$$;

revoke all on function private.issue_webhook_dispatch(text, uuid) from public, anon, authenticated;

create or replace function public.consume_webhook_dispatch(
  p_token uuid,
  p_kind text,
  p_record_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  consumed integer;
begin
  update private.webhook_dispatches
  set consumed_at = now()
  where token = p_token
    and kind = p_kind
    and record_id = p_record_id
    and consumed_at is null
    and expires_at > now();

  get diagnostics consumed = row_count;
  return consumed = 1;
end;
$$;

revoke all on function public.consume_webhook_dispatch(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.consume_webhook_dispatch(uuid, text, uuid) to service_role;

-- Validate and throttle orders in the database so direct REST callers cannot
-- bypass the React form. Privileged fields are server-controlled for non-admins.
create or replace function private.harden_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  normalized_phone text;
  recent_count integer;
  admin_user boolean;
begin
  if length(btrim(new.groom_name)) not between 2 and 120 then
    raise exception 'invalid groom_name';
  end if;
  if length(btrim(new.bride_name)) not between 1 and 120 then
    raise exception 'invalid bride_name';
  end if;

  normalized_phone := regexp_replace(coalesce(new.groom_phone, ''), '[^0-9+]', '', 'g');
  if length(normalized_phone) not between 9 and 16 then
    raise exception 'invalid phone';
  end if;
  if new.bride_phone is not null and btrim(new.bride_phone) not in ('', '-')
     and length(regexp_replace(new.bride_phone, '[^0-9+]', '', 'g')) not between 9 and 16 then
    raise exception 'invalid secondary phone';
  end if;

  if length(btrim(new.email)) > 254
     or btrim(new.email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email';
  end if;
  if new.event_location is not null and length(new.event_location) > 300 then
    raise exception 'event_location too long';
  end if;
  if new.package_title is not null and length(new.package_title) > 1000 then
    raise exception 'package_title too long';
  end if;
  if new.referral_detail is not null and length(new.referral_detail) > 12000 then
    raise exception 'referral_detail too long';
  end if;
  if new.internal_notes is not null and length(new.internal_notes) > 12000 then
    raise exception 'internal_notes too long';
  end if;
  if jsonb_typeof(new.upgrades) <> 'array' or pg_column_size(new.upgrades) > 131072 then
    raise exception 'invalid upgrades';
  end if;

  if coalesce(new.base_price, 0) < 0 or coalesce(new.base_price, 0) > 1000000
     or coalesce(new.upgrades_total, 0) < 0 or coalesce(new.upgrades_total, 0) > 1000000
     or coalesce(new.delivery_price, 0) < 0 or coalesce(new.delivery_price, 0) > 1000000
     or coalesce(new.coupon_discount, 0) < 0 or coalesce(new.coupon_discount, 0) > 1000000
     or coalesce(new.total_price, 0) < 0 or coalesce(new.total_price, 0) > 2000000
     or coalesce(new.admin_discount, 0) < 0 or coalesce(new.admin_discount, 0) > 1000000 then
    raise exception 'invalid monetary value';
  end if;

  if new.groom_signature_path is not null
     and new.groom_signature_path !~ ('^' || new.id::text || '/(groom|primary)\.png$') then
    raise exception 'invalid primary signature path';
  end if;
  if new.bride_signature_path is not null
     and new.bride_signature_path !~ ('^' || new.id::text || '/(bride|secondary)\.png$') then
    raise exception 'invalid secondary signature path';
  end if;

  admin_user := coalesce(public.is_admin(), false);
  if not admin_user then
    select count(*) into recent_count
    from public.orders o
    where o.created_at > now() - interval '15 minutes'
      and (
        lower(btrim(o.email)) = lower(btrim(new.email))
        or regexp_replace(coalesce(o.groom_phone, ''), '[^0-9+]', '', 'g') = normalized_phone
      );

    if recent_count >= 3 then
      raise exception using errcode = 'P0001', message = 'rate_limited';
    end if;

    new.status := 'new';
    new.received_by := null;
    new.admin_discount := 0;

    if coalesce(new.coupon_discount, 0) > 0
       and not public.validate_coupon(coalesce(new.coupon_code, '')) then
      new.coupon_discount := 0;
    end if;
    new.coupon_discount := least(greatest(coalesce(new.coupon_discount, 0), 0), 500);
    new.delivery_price := case
      when new.include_delivery then least(greatest(coalesce(new.delivery_price, 0), 0), 500)
      else 0
    end;
    new.total_price := greatest(
      coalesce(new.base_price, 0)
      + coalesce(new.upgrades_total, 0)
      + coalesce(new.delivery_price, 0)
      - coalesce(new.coupon_discount, 0),
      0
    );
  end if;

  return new;
end;
$$;

revoke all on function private.harden_order_insert() from public, anon, authenticated;
drop trigger if exists harden_order_insert on public.orders;
create trigger harden_order_insert
before insert on public.orders
for each row execute function private.harden_order_insert();

-- Validate and throttle leads server-side too. Public callers cannot choose
-- workflow state/source even if they bypass the website UI.
create or replace function private.harden_website_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  normalized_phone text;
  recent_count integer;
  admin_user boolean;
begin
  if length(btrim(new.full_name)) not between 2 and 120 then
    raise exception 'invalid full_name';
  end if;
  normalized_phone := regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g');
  if length(normalized_phone) not between 9 and 16 then
    raise exception 'invalid phone';
  end if;
  if new.email is not null and btrim(new.email) <> '' and (
    length(btrim(new.email)) > 254
    or btrim(new.email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ) then
    raise exception 'invalid email';
  end if;
  if new.page_url is not null and length(new.page_url) > 2048 then
    raise exception 'page_url too long';
  end if;
  if new.user_agent is not null and length(new.user_agent) > 1024 then
    raise exception 'user_agent too long';
  end if;

  admin_user := coalesce(public.is_admin(), false);
  if not admin_user then
    select count(*) into recent_count
    from public.website_leads l
    where l.created_at > now() - interval '15 minutes'
      and (
        regexp_replace(coalesce(l.phone, ''), '[^0-9+]', '', 'g') = normalized_phone
        or (
          new.email is not null and btrim(new.email) <> ''
          and lower(btrim(coalesce(l.email, ''))) = lower(btrim(new.email))
        )
      );

    if recent_count >= 5 then
      raise exception using errcode = 'P0001', message = 'rate_limited';
    end if;

    new.source := 'homepage-popup';
    new.status := 'new';
  end if;

  return new;
end;
$$;

revoke all on function private.harden_website_lead_insert() from public, anon, authenticated;
drop trigger if exists harden_website_lead_insert on public.website_leads;
create trigger harden_website_lead_insert
before insert on public.website_leads
for each row execute function private.harden_website_lead_insert();

-- Keep the existing payload fields temporarily for zero-downtime deployment:
-- the hardened Edge Functions ignore them and fetch canonical rows by record_id.
create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public, private, net, pg_temp
as $$
declare
  dispatch_token uuid;
begin
  dispatch_token := private.issue_webhook_dispatch('order', new.id);
  perform net.http_post(
    url := 'https://deafgaztsyukmmeqnmvw.supabase.co/functions/v1/send-order-emails',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'token', dispatch_token,
      'record_id', new.id,
      'type', 'INSERT',
      'table', 'orders',
      'schema', 'public',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

revoke execute on function public.notify_new_order() from public, anon, authenticated;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
after insert on public.orders
for each row execute function public.notify_new_order();

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public, private, net, pg_temp
as $$
declare
  dispatch_token uuid;
begin
  dispatch_token := private.issue_webhook_dispatch('lead', new.id);
  perform net.http_post(
    url := 'https://deafgaztsyukmmeqnmvw.supabase.co/functions/v1/send-lead-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'token', dispatch_token,
      'record_id', new.id,
      'lead', jsonb_build_object(
        'id', new.id,
        'fullName', new.full_name,
        'phone', new.phone,
        'email', new.email,
        'estimatedEventDate', new.estimated_event_date
      )
    )
  );
  return new;
end;
$$;

revoke execute on function public.notify_new_lead() from public, anon, authenticated;
drop trigger if exists on_website_lead_created on public.website_leads;
create trigger on_website_lead_created
after insert on public.website_leads
for each row execute function public.notify_new_lead();

-- Storage: enforce both byte limits and MIME allowlists at the service layer.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/png']::text[]
where id = 'signatures';

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'image/heic', 'image/heif', 'image/gif', 'image/bmp',
      'image/tiff', 'image/jxl', 'image/x-icon'
    ]::text[]
where id = 'package-images';

-- Public signature uploads are limited to UUID folders and the exact PNG names
-- generated by the application. Reading remains admin-only.
drop policy if exists "allow anon upload signatures" on storage.objects;
create policy "allow anon upload signatures"
on storage.objects for insert
to anon
with check (
  bucket_id = 'signatures'
  and name ~ '^[0-9a-f-]{36}/(groom|bride|primary|secondary)\.png$'
);

drop policy if exists "allow auth upload signatures" on storage.objects;
create policy "allow auth upload signatures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'signatures'
  and name ~ '^[0-9a-f-]{36}/(groom|bride|primary|secondary)\.png$'
);

-- Catalogue uploads are admin-only already; also restrict the object name to
-- extensions that correspond to the bucket MIME allowlist.
drop policy if exists "package images admin write" on storage.objects;
create policy "package images admin write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'package-images'
  and (select public.is_admin())
  and lower(storage.extension(name)) in (
    'jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'heif',
    'gif', 'bmp', 'tif', 'tiff', 'jxl', 'ico'
  )
);

drop policy if exists "package images admin update" on storage.objects;
create policy "package images admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'package-images' and (select public.is_admin()))
with check (
  bucket_id = 'package-images'
  and (select public.is_admin())
  and lower(storage.extension(name)) in (
    'jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'heif',
    'gif', 'bmp', 'tif', 'tiff', 'jxl', 'ico'
  )
);
