-- Créneaux déjà réservés d'un service, pour le calendrier public.
-- Ne renvoie que des dates : aucune donnée client.

create or replace function public.booked_service_slots(p_product_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(to_jsonb(b.starts_at) order by b.starts_at),
    '[]'::jsonb
  )
  from public.bookings b
  where b.product_id = p_product_id
    and b.status = 'confirmed'
    and b.starts_at > now();
$$;

revoke execute on function public.booked_service_slots(uuid)
  from public, anon, authenticated;
grant execute on function public.booked_service_slots(uuid)
  to anon, authenticated;
