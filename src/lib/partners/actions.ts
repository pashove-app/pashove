"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PartnerOfferState } from "@/lib/partners/types";
import { createClient } from "@/lib/supabase/server";
import {
  canManageCatalog,
  currentMembership,
} from "@/lib/stores/queries";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function messageKeyFor(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("partner_no_variants")) return "noVariants";
  if (message.includes("partner_physical_only")) return "physicalOnly";
  if (message.includes("partner_chain_forbidden")) return "chain";
  if (message.includes("partner_commission_invalid")) return "commissionInvalid";
  if (message.includes("product_unavailable")) return "productUnavailable";
  if (message.includes("not_owner")) return "notOwner";

  return "serverError";
}

/** Active ou met à jour l'offre de partage d'un produit. */
export async function savePartnerOfferAction(
  _previous: PartnerOfferState,
  formData: FormData,
): Promise<PartnerOfferState> {
  const locale = field(formData, "locale") || "fr";
  const productId = field(formData, "productId");
  const commissionBps = Number.parseInt(field(formData, "commission"), 10);
  const active = field(formData, "active") === "on";

  const membership = await currentMembership();
  if (!membership) return { status: "error", messageKey: "serverError" };
  if (!canManageCatalog(membership.role)) {
    return { status: "error", messageKey: "notOwner" };
  }

  if (!productId || !Number.isFinite(commissionBps)) {
    return { status: "error", messageKey: "commissionInvalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_partner_offer", {
    p_store_id: membership.store.id,
    p_product_id: productId,
    p_commission_bps: commissionBps,
    p_active: active,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  revalidatePath(`/${locale}/app/products/${productId}`);
  revalidatePath(`/${locale}/app/partners`);

  return { status: "saved" };
}

/** Génère (ou réactive) le lien d'affiliation d'une offre. */
export async function createAffiliateLinkAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const offerId = field(formData, "offerId");

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);
  if (!canManageCatalog(membership.role)) {
    redirect(`/${locale}/app/partners?error=notOwner`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_affiliate_link", {
    p_offer_id: offerId,
    p_store_id: membership.store.id,
  });

  if (error) {
    redirect(`/${locale}/app/partners?error=serverError`);
  }

  const code = (data as { code?: string } | null)?.code;
  if (!code) redirect(`/${locale}/app/partners?error=serverError`);

  revalidatePath(`/${locale}/app/partners`);
  redirect(`/${locale}/app/partners?affiliate=${code}`);
}

/** Ajoute une copie contrôlée du produit partenaire à la boutique active. */
export async function addPartnerListingAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const offerId = field(formData, "offerId");

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);
  if (!canManageCatalog(membership.role)) {
    redirect(`/${locale}/app/partners?error=notOwner`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_partner_listing", {
    p_offer_id: offerId,
    p_store_id: membership.store.id,
  });

  if (error) {
    const message = error.message;

    const code = message.includes("partner_already_listed")
      ? "alreadyListed"
      : message.includes("partner_own_store")
        ? "ownStore"
        : message.includes("partner_no_variants")
          ? "noVariants"
          : message.includes("partner_physical_only")
            ? "physicalOnly"
            : message.includes("partner_offer_unavailable")
              ? "offerUnavailable"
              : message.includes("partner_product_unavailable") ||
                  message.includes("partner_store_unavailable")
                ? "productUnavailable"
                : "serverError";

    redirect(`/${locale}/app/partners?error=${code}`);
  }

  revalidatePath(`/${locale}/app/partners`);
  revalidatePath(`/${locale}/app/products`);
  revalidatePath(`/${locale}/store/${membership.store.slug}`);

  redirect(`/${locale}/app/partners?added=1`);
}
