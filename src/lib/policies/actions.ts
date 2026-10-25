"use server";

import { revalidatePath } from "next/cache";
import { POLICY_PAGES } from "@/lib/policies/pages";
import type { StorePoliciesFormState } from "@/lib/policies/types";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const IDENTITY_FIELDS = [
  "legalName",
  "legalForm",
  "address",
  "city",
  "country",
  "email",
  "phone",
  "registrationNumber",
  "taxNumber",
] as const;

const REQUIRED_FOR_PUBLISH = [
  "legalName",
  "address",
  "city",
  "country",
  "email",
  "phone",
  "registrationNumber",
] as const;

function messageKeyFor(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("identity_incomplete")) return "policiesIncomplete";
  if (message.includes("page_body_required")) return "policyBodyRequired";
  if (message.includes("invalid_page")) return "serverError";
  if (message.includes("not_owner")) return "serverError";

  return "serverError";
}

/** Enregistre l'identité légale et les cinq pages, avec contrôle de publication. */
export async function saveStorePoliciesAction(
  _previous: StorePoliciesFormState,
  formData: FormData,
): Promise<StorePoliciesFormState> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const identity = Object.fromEntries(
    IDENTITY_FIELDS.map((key) => [key, field(formData, key)]),
  ) as Record<(typeof IDENTITY_FIELDS)[number], string>;

  const fieldErrors: Record<string, string> = {};

  if (identity.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
    fieldErrors.email = "policyEmailInvalid";
  }

  if (identity.legalName.length > 160) fieldErrors.legalName = "policyFieldTooLong";
  if (identity.legalForm.length > 80) fieldErrors.legalForm = "policyFieldTooLong";
  if (identity.address.length > 200) fieldErrors.address = "policyFieldTooLong";
  if (identity.city.length > 100) fieldErrors.city = "policyFieldTooLong";
  if (identity.phone.length > 40) fieldErrors.phone = "policyFieldTooLong";
  if (identity.registrationNumber.length > 80)
    fieldErrors.registrationNumber = "policyFieldTooLong";
  if (identity.taxNumber.length > 80) fieldErrors.taxNumber = "policyFieldTooLong";

  const pages = POLICY_PAGES.map((page) => {
    const body = field(formData, `body_${page.slug}`);
    const isPublished = formData.get(`published_${page.slug}`) === "on";

    if (body.length > 20000) fieldErrors[`body_${page.slug}`] = "policyBodyTooLong";
    if (isPublished && body.length === 0) {
      fieldErrors[`body_${page.slug}`] = "policyBodyRequired";
    }

    return { slug: page.slug, body, is_published: isPublished };
  });

  const anyPublished = pages.some((page) => page.is_published);

  if (anyPublished) {
    for (const key of REQUIRED_FOR_PUBLISH) {
      if (!identity[key]) fieldErrors[key] = "policyRequiredForPublish";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "invalid",
      fieldErrors,
      messageKey: anyPublished ? "policiesIncomplete" : undefined,
    };
  }

  const rpcIdentity = {
    legal_name: identity.legalName,
    legal_form: identity.legalForm,
    address: identity.address,
    city: identity.city,
    country: identity.country,
    email: identity.email,
    phone: identity.phone,
    registration_number: identity.registrationNumber,
    tax_number: identity.taxNumber,
  };

  const { error } = await supabase.rpc("save_store_policies", {
    p_store_id: store.id,
    p_identity: rpcIdentity,
    p_pages: pages,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  revalidatePath("/", "layout");
  return { status: "saved", messageKey: "policiesSaved" };
}
