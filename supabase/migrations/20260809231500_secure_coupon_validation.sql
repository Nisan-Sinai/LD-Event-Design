create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.coupon_codes (
  code_hash text primary key,
  label text not null default 'gift',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

revoke all on private.coupon_codes from public, anon, authenticated;

create or replace function public.validate_coupon(p_code text)
returns boolean
language sql
security definer
stable
set search_path = public, private, extensions
as $$
  select exists (
    select 1
    from private.coupon_codes c
    where c.active = true
      and c.code_hash = encode(extensions.digest(lower(btrim(coalesce(p_code, ''))), 'sha256'), 'hex')
  );
$$;

revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated;

-- Coupon hashes are provisioned separately as private environment data.
-- Do not commit plaintext coupon codes or their hashes to the frontend repository.
