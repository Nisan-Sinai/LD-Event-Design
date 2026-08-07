drop policy if exists "admin emails deny direct access" on public.admin_emails;
create policy "admin emails deny direct access"
on public.admin_emails
for select
to anon, authenticated
using (false);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_new_order() from public, anon, authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter function public.notify_new_order()
set search_path = public, net, pg_temp;
