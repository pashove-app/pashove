-- PASHOVE — Abandon d'un paiement d'abonnement avant l'appel SasPay
--
-- Si la création du softpay échoue, la ligne plan_payments ne doit pas rester
-- en attente et bloquer toutes les tentatives suivantes. La fonction est
-- limitée au propriétaire et aux lignes jamais transmises à SasPay.

create or replace function public.fail_plan_payment_by_id(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.plan_payments
  set status = 'failed'
  where id = p_id
    and user_id = auth.uid()
    and status = 'pending'
    and reference is null;

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_plan_payment_by_id(uuid)
  from public, anon, authenticated;
grant execute on function public.fail_plan_payment_by_id(uuid)
  to authenticated;
