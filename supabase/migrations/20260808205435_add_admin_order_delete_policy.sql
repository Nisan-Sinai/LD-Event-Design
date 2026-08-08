-- Only authenticated administrators may delete orders.
-- Customers and anonymous visitors keep no DELETE policy, so RLS blocks them.
drop policy if exists "orders delete admin" on public.orders;

create policy "orders delete admin"
on public.orders for delete
to authenticated
using ((select public.is_admin()));
