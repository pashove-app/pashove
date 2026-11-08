-- PASHOVE — Notifications de course liées au dispatch
--
-- Le dispatch vit en base : dès qu'une course passe au statut `assigned`, il
-- faut prévenir le livreur avant que l'offre de 10 secondes n'expire. PL/pgSQL
-- ne peut pas appeler un service HTTP sans extension dédiée ; on écrit donc une
-- ligne de boîte d'envoi, que le serveur Next draine immédiatement après le
-- webhook ou l'action qui vient de dispatcher.
--
-- La boîte d'envoi est aussi l'endroit où l'on peut constater ce qui a été
-- envoyé, sans exposer les endpoints push (qui sont des capacités secrètes).

create table if not exists public.delivery_push_jobs (
  id              uuid primary key default gen_random_uuid(),
  delivery_id     uuid not null references public.deliveries (id) on delete cascade,
  courier_id      uuid not null references public.couriers (id) on delete cascade,
  courier_user_id uuid not null references auth.users (id) on delete cascade,
  store_name      text not null,
  fee_amount      integer not null check (fee_amount >= 0),
  currency        text not null check (currency ~ '^[A-Z]{3}$'),
  expires_at      timestamptz not null,
  status          text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts        integer not null default 0 check (attempts >= 0),
  last_error      text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz,
  unique (delivery_id, courier_id)
);

create index if not exists delivery_push_jobs_pending_idx
  on public.delivery_push_jobs (status, expires_at);

alter table public.delivery_push_jobs enable row level security;

revoke all on public.delivery_push_jobs from public, anon, authenticated;
grant select, update, delete on public.delivery_push_jobs to service_role;

/* ------------------------------------------------------------------ *
 *  Enqueue à l'assignation, annulation dès que l'offre n'est plus vive
 * ------------------------------------------------------------------ */

create or replace function public.sync_delivery_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid;
  v_store text;
begin
  if NEW.status = 'assigned'
     and NEW.courier_id is not null
     and NEW.offer_expires_at is not null then
    -- Une extension de la même offre ne renvoie pas une seconde notification.
    if TG_OP = 'UPDATE'
       and OLD.status = 'assigned'
       and OLD.courier_id = NEW.courier_id then
      return NEW;
    end if;

    select c.user_id into v_user
    from public.couriers c
    where c.id = NEW.courier_id;

    if v_user is null then
      return NEW;
    end if;

    select s.name into v_store
    from public.stores s
    where s.id = NEW.store_id;

    insert into public.delivery_push_jobs (
      delivery_id, courier_id, courier_user_id,
      store_name, fee_amount, currency, expires_at
    )
    values (
      NEW.id, NEW.courier_id, v_user,
      coalesce(v_store, 'Pashove'), NEW.fee_amount, NEW.currency,
      NEW.offer_expires_at
    )
    on conflict (delivery_id, courier_id) do update
      set status = 'pending',
          attempts = 0,
          last_error = null,
          expires_at = excluded.expires_at,
          store_name = excluded.store_name,
          fee_amount = excluded.fee_amount,
          currency = excluded.currency,
          created_at = now()
      where public.delivery_push_jobs.status = 'failed';

    return NEW;
  end if;

  -- Offre acceptée, refusée, expirée ou course terminée : plus rien à envoyer.
  if NEW.status <> 'assigned' then
    update public.delivery_push_jobs
    set status = 'cancelled',
        last_error = 'offer_closed'
    where delivery_id = NEW.id
      and status = 'pending';
  end if;

  return NEW;
end;
$$;

drop trigger if exists deliveries_sync_push on public.deliveries;
create trigger deliveries_sync_push
  after insert or update of status, courier_id, offer_expires_at
  on public.deliveries
  for each row execute function public.sync_delivery_push();
