import { createClient } from "@/lib/supabase/server";
import type { StoreRole } from "@/lib/stores/queries";

export type TeamMember = {
  user_id: string;
  full_name: string;
  email: string;
  role: StoreRole;
  joined_at: string;
};

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type TeamInvitation = {
  id: string;
  email: string;
  role: StoreRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
};

/** Membres de la boutique active, nom et e-mail compris. */
export async function listTeamMembers(storeId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_store_members", {
    p_store_id: storeId,
  });

  return (data ?? []) as TeamMember[];
}

/** Invitations en attente ou passées, les plus récentes d'abord. */
export async function listTeamInvitations(
  storeId: string,
): Promise<TeamInvitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_invitations")
    .select("id, email, role, status, token, expires_at, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? []) as TeamInvitation[];
}

export type AccountPlan = {
  code: string;
  name: string;
  commission_bps: number;
  max_stores: number;
  max_members: number;
};

/** Plan du compte connecté (Free par défaut). */
export async function readAccountPlan(): Promise<AccountPlan> {
  const fallback: AccountPlan = {
    code: "free",
    name: "Free",
    commission_bps: 1000,
    max_stores: 2,
    max_members: 2,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallback;

  const { data } = await supabase
    .from("account_plans")
    .select("plan:plans!plan_code(code, name, commission_bps, max_stores, max_members)")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = (data as { plan: AccountPlan | null } | null)?.plan;
  return plan ?? fallback;
}
