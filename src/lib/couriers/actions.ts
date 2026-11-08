"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";
import { uploadObject } from "@/lib/r2/client";
import { isAllowedImageType, MAX_IMAGE_BYTES } from "@/lib/r2/media";

export type CourierFormState = {
  status: "idle" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function storeDocument(
  file: unknown,
  storeId: string,
): Promise<string | null> {
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) return null;
  const blob = file as File;

  if (blob.size <= 0 || blob.size > MAX_IMAGE_BYTES) return null;
  if (!isAllowedImageType(blob.type)) return null;

  const body = new Uint8Array(await blob.arrayBuffer());

  return uploadObject({
    storeId,
    kind: "kyc_document",
    contentType: blob.type,
    body,
  });
}

/** Dépôt du dossier livreur : photos privées + demande en attente. */
export async function submitCourierApplicationAction(
  _previous: CourierFormState,
  formData: FormData,
): Promise<CourierFormState> {
  const locale = field(formData, "locale") || "fr";
  const store = await currentStore();

  if (!store) {
    return {
      status: "error",
      message: "Termine d’abord la création de ta boutique, puis reviens.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Connecte-toi pour envoyer ton dossier.",
    };
  }

  const fullName = field(formData, "fullName");
  const phone = field(formData, "phone");
  const email = field(formData, "email");

  if (fullName.length < 2 || phone.length < 6 || !email.includes("@")) {
    return {
      status: "error",
      message: "Vérifie ton nom, ton téléphone et ton e-mail.",
    };
  }

  const [idDocumentKey, selfieKey] = await Promise.all([
    storeDocument(formData.get("idDocument"), store.id),
    storeDocument(formData.get("selfie"), store.id),
  ]);

  if (!idDocumentKey || !selfieKey) {
    return {
      status: "error",
      message:
        "Ajoute une photo lisible de ta pièce d’identité et un selfie (JPEG, PNG ou WebP, 5 Mo maximum).",
    };
  }

  const { error } = await supabase.rpc("submit_courier_application", {
    p_full_name: fullName,
    p_phone: phone,
    p_email: email,
    p_id_key: idDocumentKey,
    p_selfie_key: selfieKey,
  });

  if (error) {
    console.error("[courier] submit failed", error.message);
    return {
      status: "error",
      message:
        error.message.includes("approved")
          ? "Ton dossier est déjà validé."
          : "Envoi impossible pour le moment. Réessaie.",
    };
  }

  revalidatePath(`/${locale}/devenir-livreur`);
  redirect(`/${locale}/app/courier?submitted=1`);
}

/** Décision admin. Le contrôle de rôle est fait dans la RPC. */
export async function reviewCourierAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  const status = field(formData, "status");
  const reason = field(formData, "reason");

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_courier", {
    p_id: id,
    p_status: status,
    p_reason: reason || null,
  });

  if (error) {
    redirect(`/platform-admin/couriers?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/platform-admin/couriers");
  redirect("/platform-admin/couriers");
}
