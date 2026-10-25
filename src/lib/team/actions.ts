"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_STORE_COOKIE,
  canManageTeam,
  currentMembership,
} from "@/lib/stores/queries";
import { listTeamMembers, readAccountPlan } from "@/lib/team/queries";
import type { InviteMemberState } from "@/lib/team/types";
import { toFieldErrors } from "@/lib/validation";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("emailInvalid").max(254),
  role: z.enum(["admin", "product_manager"], { message: "roleInvalid" }),
});

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Envoie (ou prépare) une invitation à rejoindre la boutique active. */
export async function inviteMemberAction(
  _previous: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = inviteSchema.safeParse({
    email: field(formData, "email"),
    role: field(formData, "role"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const membership = await currentMembership();
  if (!membership) return { status: "error", messageKey: "sessionExpired" };
  if (!canManageTeam(membership.role)) {
    return { status: "error", messageKey: "accessDenied" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", messageKey: "sessionExpired" };

  const plan = await readAccountPlan();
  const members = await listTeamMembers(membership.store.id);

  const alreadyMember = members.some(
    (member) => member.email.toLowerCase() === parsed.data.email,
  );
  if (alreadyMember) {
    return { status: "invalid", fieldErrors: { email: "alreadyMember" } };
  }

  const { count: pending } = await supabase
    .from("store_invitations")
    .select("id", { count: "exact", head: true })
    .eq("store_id", membership.store.id)
    .eq("status", "pending");

  if (members.length + (pending ?? 0) >= plan.max_members) {
    return { status: "error", messageKey: "memberLimit" };
  }

  const { data, error } = await supabase
    .from("store_invitations")
    .insert({
      store_id: membership.store.id,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select("token")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === "23505") {
      return { status: "invalid", fieldErrors: { email: "alreadyInvited" } };
    }
    return { status: "error", messageKey: "serverError" };
  }

  revalidatePath(`/${locale}/app/settings/users`);

  return {
    status: "sent",
    invitePath: `/${locale}/auth/accept-invitation?token=${data.token}`,
  };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const id = field(formData, "id");

  if (!id) redirect(`/${locale}/app/settings/users`);

  const membership = await currentMembership();
  if (!membership || !canManageTeam(membership.role)) {
    redirect(`/${locale}/app/settings/users`);
  }

  const supabase = await createClient();
  await supabase
    .from("store_invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("store_id", membership.store.id)
    .eq("status", "pending");

  revalidatePath(`/${locale}/app/settings/users`);
  redirect(`/${locale}/app/settings/users?updated=1`);
}

/** Accepte l'invitation pour le compte connecté, puis ouvre la boutique. */
export async function acceptInvitationAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const token = field(formData, "token");

  if (!token) redirect(`/${locale}/app`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const { data, error } = await supabase.rpc("accept_store_invitation", {
    p_token: token,
  });

  if (error || !data) {
    const message = error?.message ?? "";
    const reason = message.includes("invitation_email_mismatch")
      ? "wrongEmail"
      : message.includes("invitation_invalid")
        ? "invalidInvitation"
        : "serverError";
    redirect(`/${locale}/auth/accept-invitation?token=${token}&error=${reason}`);
  }

  (await cookies()).set(ACTIVE_STORE_COOKIE, data as string, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect(`/${locale}/app?joined=1`);
}
