create index if not exists orders_user_id_idx on public.orders (user_id);

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "orders insert own" on public.orders;
create policy "orders insert own"
on public.orders for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin"
on public.orders for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "package_overrides admin write" on public.package_overrides;

drop policy if exists "package_overrides admin insert" on public.package_overrides;
create policy "package_overrides admin insert"
on public.package_overrides for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "package_overrides admin update" on public.package_overrides;
create policy "package_overrides admin update"
on public.package_overrides for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "package_overrides admin delete" on public.package_overrides;
create policy "package_overrides admin delete"
on public.package_overrides for delete
to authenticated
using ((select public.is_admin()));
