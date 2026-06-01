-- ============================================================
-- Webhook: על כל INSERT לטבלת orders → קריאה ל-Edge Function
-- ששולחת את שני המיילים (ללירון וללקוח).
-- ============================================================

create extension if not exists pg_net;

create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://deafgaztsyukmmeqnmvw.supabase.co/functions/v1/send-order-emails',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'orders',
      'schema', 'public',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
  after insert on public.orders
  for each row execute function public.notify_new_order();
