"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deliverEmail } from "@/lib/email/transport";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ADMIN_PATH = "/platform-admin/delivery-partners";
const PARTNER_PATH = "/partner/delivery";

export type JoinState = {
  status: "idle" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://pashove.com").replace(
    /\/$/,
    "",
  );
}

async function sendInvite(to: string, subject: string, title: string, body: string, link: string) {
  await deliverEmail({
    to,
    toName: null,
    subject,
    template: "delivery_partner_invite",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0A0E1A">
      <h1 style="font-size:24px;margin:0 0 16px">${title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#4B5563">${body}</p>
      <p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#2F5CFF;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600">Ouvrir mon espace</a></p>
      <p style="font-size:12px;color:#8A93A5">Si le bouton ne fonctionne pas : ${link}</p>
      <p style="font-size:12px;color:#8A93A5">Pashove · pashove.com</p>
    </div>`,
    text: `${title}\n\n${body}\n\n${link}\n\nPashove`,
  });
}

/* ------------------------------------------------------------------ *
 *  Administration
 * ------------------------------------------------------------------ */

export async function createDeliveryPartnerAction(
  formData: FormData,
): Promise<void> {
  const company = field(formData, "companyName");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const country = field(formData, "country").toUpperCase();
  const commissionPercent = Number(field(formData, "commissionPercent") || "10");

  if (
    company.length < 2 ||
    !email.includes("@") ||
    country.length !== 2 ||
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    redirect(`${ADMIN_PATH}?error=invalid`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_delivery_partner", {
    p_company_name: company,
    p_email: email,
    p_phone: phone || null,
    p_country: country,
    p_commission_bps: Math.round(commissionPercent * 100),
  });

  if (error || !data) {
    console.error("[partners] create failed", error?.message);
    redirect(`${ADMIN_PATH}?error=save`);
  }

  const partner = data as {
    inviteToken?: string;
    email?: string;
    companyName?: string;
  };

  if (partner.inviteToken && partner.email) {
    const link = `${siteUrl()}/fr/partner/delivery/join?token=${partner.inviteToken}`;
    await sendInvite(
      partner.email,
      "Votre espace livreur partenaire Pashove",
      `Bienvenue, ${partner.companyName ?? company}`,
      "Votre entreprise de livraison dispose d’un espace Pashove. Créez votre mot de passe pour accéder à vos courses, vos livreurs et vos revenus.",
      link,
    );
  }

  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}?ok=1`);
}

export async function settlePartnerPayoutAction(
  formData: FormData,
): Promise<void> {
  const payoutId = field(formData, "payoutId");
  const status = field(formData, "status");

  if (!payoutId || !["paid", "rejected"].includes(status)) {
    redirect(`${ADMIN_PATH}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_settle_partner_payout", {
    p_payout_id: payoutId,
    p_status: status,
  });

  if (error) {
    console.error("[partners] settle payout failed", error.message);
    redirect(`${ADMIN_PATH}?error=payout`);
  }

  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}?ok=payout`);
}

/* ------------------------------------------------------------------ *
 *  Espace partenaire
 * ------------------------------------------------------------------ */

export async function addPartnerDriverAction(
  formData: FormData,
): Promise<void> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const compensationType = field(formData, "compensationType") || "commission";
  const commissionPercent = Number(field(formData, "commissionPercent") || "0");
  const salary = Number(field(formData, "salaryAmount") || "0");

  if (
    name.length < 2 ||
    !email.includes("@") ||
    phone.length < 6 ||
    !Number.isFinite(commissionPercent) ||
    !Number.isFinite(salary)
  ) {
    redirect(`${PARTNER_PATH}?error=invalid`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_partner_driver", {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_compensation_type: compensationType,
    p_commission_bps: Math.round(Math.min(Math.max(commissionPercent, 0), 90) * 100),
    p_salary_amount: Math.max(0, Math.round(salary)),
  });

  if (error || !data) {
    console.error("[partners] add driver failed", error?.message);
    redirect(`${PARTNER_PATH}?error=save`);
  }

  const driver = data as {
    inviteCode?: string;
    email?: string;
    name?: string;
  };

  if (driver.inviteCode && driver.email) {
    const link = `${siteUrl()}/fr/delivery-partner/join?code=${driver.inviteCode}`;
    await sendInvite(
      driver.email,
      "Rejoignez la flotte Pashove de votre partenaire",
      `Bonjour ${driver.name ?? name}`,
      "Votre entreprise de livraison vous invite à rejoindre sa flotte sur Pashove. Créez votre compte pour recevoir les courses.",
      link,
    );
  }

  revalidatePath(PARTNER_PATH);
  redirect(`${PARTNER_PATH}?ok=driver`);
}

export async function requestPartnerPayoutAction(
  formData: FormData,
): Promise<void> {
  const amount = Number(field(formData, "amount"));

  if (!Number.isInteger(amount) || amount <= 0) {
    redirect(`${PARTNER_PATH}?error=amount`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_partner_payout", {
    p_amount: amount,
  });

  if (error) {
    console.error("[partners] payout request failed", error.message);
    redirect(`${PARTNER_PATH}?error=payout`);
  }

  revalidatePath(PARTNER_PATH);
  redirect(`${PARTNER_PATH}?ok=payout`);
}

/* ------------------------------------------------------------------ *
 *  Inscription partenaire (lien email)
 * ------------------------------------------------------------------ */

const joinPartnerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(72),
});

export async function joinDeliveryPartnerAction(
  _previous: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = field(formData, "token");
  const parsed = joinPartnerSchema.safeParse({
    fullName: field(formData, "fullName"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Vérifie ton nom et ton mot de passe (8 caractères minimum)." };
  }

  const service = createServiceClient();
  if (!service) {
    return { status: "error", message: "Service indisponible. Réessaie plus tard." };
  }

  const { data: partner } = await service
    .from("delivery_partners")
    .select("id, company_name, email, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!partner || partner.status !== "invited") {
    return { status: "error", message: "Ce lien d’invitation n’est plus valide." };
  }

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: partner.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });

  if (createError || !created.user) {
    return {
      status: "error",
      message: createError?.message.includes("already")
        ? "Un compte existe déjà pour cet e-mail. Connecte-toi puis rouvre le lien."
        : "Impossible de créer le compte. Réessaie.",
    };
  }

  const { error: activateError } = await service.rpc(
    "activate_delivery_partner",
    { p_token: token, p_user_id: created.user.id },
  );

  if (activateError) {
    console.error("[partners] activate failed", activateError.message);
    return { status: "error", message: "Impossible d’activer l’espace partenaire." };
  }

  redirect("/fr/auth/login?redirect=%2Fpartner%2Fdelivery");
}

/* ------------------------------------------------------------------ *
 *  Inscription livreur partenaire (code email)
 * ------------------------------------------------------------------ */

const joinDriverSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  password: z.string().min(8).max(72),
});

export async function joinPartnerDriverAction(
  _previous: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code = field(formData, "code");
  const parsed = joinDriverSchema.safeParse({
    name: field(formData, "name"),
    phone: field(formData, "phone"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Vérifie ton nom, ton téléphone et ton mot de passe." };
  }

  const service = createServiceClient();
  if (!service) {
    return { status: "error", message: "Service indisponible. Réessaie plus tard." };
  }

  const { data: driver } = await service
    .from("partner_drivers")
    .select("id, name, email, phone, status, partner_id")
    .eq("invite_code", code)
    .maybeSingle();

  if (!driver || driver.status !== "invited") {
    return { status: "error", message: "Ce code d’invitation n’est plus valide." };
  }

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: driver.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.name },
    });

  if (createError || !created.user) {
    return {
      status: "error",
      message: createError?.message.includes("already")
        ? "Un compte existe déjà pour cet e-mail. Connecte-toi puis rouvre le lien."
        : "Impossible de créer le compte. Réessaie.",
    };
  }

  const { error: joinError } = await service.rpc("join_partner_driver", {
    p_code: code,
    p_user_id: created.user.id,
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
  });

  if (joinError) {
    console.error("[partners] driver join failed", joinError.message);
    return { status: "error", message: "Impossible d’activer le compte livreur." };
  }

  redirect("/fr/auth/login?redirect=%2Fapp%2Fcourier");
}
