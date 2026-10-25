-- Sans KYC, `v_kyc <> 'approved'` vaut NULL et la condition serait fausse.
-- On rend l'exigence explicite : tout autre état que `approved`, y compris
-- l'absence de dossier, bloque le traitement.

create or replace function public.admin_transition_payout(
  p_payout_id uuid,
  p_action    text,
  p_reference text default null,
  p_reason    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts%rowtype;
  v_kyc    text;
  v_status text;
begin
  if not public.has_platform_role(
    array['super_admin', 'payout_operator', 'finance_operator']
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select p.* into v_payout
  from public.payouts p
  where p.id = p_payout_id
  for update;

  if v_payout.id is null then
    raise exception 'payout_not_found' using errcode = '22023';
  end if;

  select c.status into v_kyc
  from public.kyc_cases c
  where c.store_id = v_payout.store_id;

  if p_action in ('processing', 'sent', 'completed')
     and v_kyc is distinct from 'approved' then
    raise exception 'kyc_required' using errcode = '22023';
  end if;

  v_status := case p_action
    when 'processing' then 'processing'
    when 'sent' then 'sent'
    when 'completed' then 'completed'
    when 'failed' then 'failed'
    else null
  end;

  if v_status is null then
    raise exception 'invalid_action' using errcode = '22023';
  end if;

  if p_action = 'processing' and v_payout.status not in ('requested', 'security_check') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'sent' and v_payout.status <> 'processing' then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'completed' and v_payout.status <> 'sent' then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'failed' and v_payout.status not in ('requested', 'security_check', 'processing', 'sent') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'sent' and (p_reference is null or char_length(btrim(p_reference)) = 0) then
    raise exception 'reference_required' using errcode = '22023';
  end if;

  update public.payouts
  set status = v_status,
      reviewed_at = case when p_action = 'processing' then now() else reviewed_at end,
      sent_at = case when p_action = 'sent' then now() else sent_at end,
      completed_at = case when p_action = 'completed' then now() else completed_at end,
      provider_reference = case when p_action = 'sent' then btrim(p_reference) else provider_reference end,
      failure_reason = case when p_action = 'failed' then nullif(btrim(coalesce(p_reason, '')), '') else failure_reason end
  where id = p_payout_id;

  if p_action = 'completed' then
    perform public.post_ledger_transaction(
      v_payout.store_id, 'payout_paid', 'payout', v_payout.id,
      'payout-paid:' || v_payout.id::text,
      jsonb_build_object('payout_id', v_payout.id, 'reference', p_reference),
      jsonb_build_array(
        jsonb_build_object('account', 'payouts', 'direction', 'debit',
          'amount', v_payout.amount, 'currency', v_payout.currency),
        jsonb_build_object('account', 'reserved', 'direction', 'credit',
          'amount', v_payout.amount, 'currency', v_payout.currency)
      )
    );
  elsif p_action = 'failed' then
    perform public.post_ledger_transaction(
      v_payout.store_id, 'payout_released', 'payout', v_payout.id,
      'payout-failed-release:' || v_payout.id::text,
      jsonb_build_object('payout_id', v_payout.id, 'reason', p_reason),
      jsonb_build_array(
        jsonb_build_object('account', 'available', 'direction', 'debit',
          'amount', v_payout.amount, 'currency', v_payout.currency),
        jsonb_build_object('account', 'reserved', 'direction', 'credit',
          'amount', v_payout.amount, 'currency', v_payout.currency)
      )
    );
  end if;

  insert into public.payout_events (payout_id, store_id, status, actor_id, note)
  values (v_payout.id, v_payout.store_id, v_status, auth.uid(), nullif(btrim(coalesce(p_reason, '')), ''));

  insert into public.platform_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(), 'payout.' || v_status, 'payout', v_payout.id,
    jsonb_build_object('reference', p_reference, 'reason', p_reason)
  );

  return jsonb_build_object('status', v_status);
end;
$$;

revoke execute on function public.admin_transition_payout(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_transition_payout(uuid, text, text, text)
  to authenticated;
