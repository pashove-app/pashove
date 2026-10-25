"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  encryptSensitive,
  isPayoutEncryptionConfigured,
} from "@/lib/finance/crypto";
import { getKycStatus } from "@/lib/kyc/queries";
import { documentLast4, kycSchema } from "@/lib/kyc/schema";
import type { KycFormState } from "@/lib/kyc/types";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function messageKeyFor(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("kyc_pending")) return "kycPending";
  if (message.includes("kyc_already_approved")) return "kycAlreadyApproved";
  if (message.includes("invalid_kyc_name")) return "kycNameInvalid";
  if (message.includes("invalid_kyc_birth_date")) return "kycBirthDateInvalid";
  if (message.includes("invalid_kyc_country")) return "kycCountryInvalid";
  if (message.includes("invalid_kyc_document")) return "kycDocumentInvalid";
  if (message.includes("invalid_kyc_documents")) return "kycDocumentsRequired";

  return "serverError";
}

/** Soumet un dossier KYC manuel (documents privés, numéro chiffré). */
export async function submitKycAction(
  _previous: KycFormState,
  formData: FormData,
): Promise<KycFormState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = kycSchema.safeParse({
    legalName: field(formData, "legalName"),
    birthDate: field(formData, "birthDate"),
    country: field(formData, "country"),
    documentType: field(formData, "documentType"),
    documentNumber: field(formData, "documentNumber"),
    frontMediaId: field(formData, "frontMediaId"),
    backMediaId: field(formData, "backMediaId"),
    selfieMediaId: field(formData, "selfieMediaId"),
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };
  if (!isPayoutEncryptionConfigured()) {
    return { status: "error", messageKey: "encryptionNotConfigured" };
  }

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const current = await getKycStatus(store.id);
  if (current.status === "approved") {
    return { status: "error", messageKey: "kycAlreadyApproved" };
  }
  if (current.status === "submitted" || current.status === "under_review") {
    return { status: "error", messageKey: "kycPending" };
  }

  const digits = parsed.data.documentNumber.replace(/[^A-Za-z0-9]/g, "");

  const { error } = await supabase.rpc("submit_kyc", {
    p_store_id: store.id,
    p_legal_name: parsed.data.legalName,
    p_birth_date: parsed.data.birthDate,
    p_country: parsed.data.country,
    p_document_type: parsed.data.documentType,
    p_document_number_encrypted: encryptSensitive(digits),
    p_document_last4: documentLast4(digits),
    p_front_media_id: parsed.data.frontMediaId,
    p_back_media_id: parsed.data.backMediaId || null,
    p_selfie_media_id: parsed.data.selfieMediaId,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/finance/kyc?submitted=1`);
}
