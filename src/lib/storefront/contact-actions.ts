"use server";

import { after } from "next/server";
import { z } from "zod";
import { emailContactMessage } from "@/lib/email/events";
import { createPublicClient } from "@/lib/supabase/public";
import { loadStorefront } from "@/lib/storefront/queries";

export type ContactState = {
  status: "idle" | "sent" | "invalid" | "error";
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "contactRequired").max(120, "contactRequired"),
  email: z.string().trim().email("contactRequired").max(254, "contactRequired"),
  message: z
    .string()
    .trim()
    .min(5, "contactRequired")
    .max(2000, "contactRequired"),
});

export async function sendContactAction(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const locale = String(formData.get("locale") ?? "fr").trim();
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success || !slug) return { status: "invalid" };

  const { store } = await loadStorefront(slug);
  if (!store) return { status: "error" };

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("store_contact_submit", {
    p_slug: slug,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_message: parsed.data.message,
  });

  if (error) return { status: "error" };

  if (store.contact_email) {
    after(async () => {
      await emailContactMessage({
        to: store.contact_email!,
        storeName: store.name,
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        locale,
      });
    });
  }

  return { status: "sent" };
}
