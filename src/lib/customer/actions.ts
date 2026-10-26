"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CustomerAuthState } from "@/lib/customer/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { loginSchema, registerSchema, toFieldErrors } from "@/lib/validation";
import { rememberedOrderTokens } from "@/lib/customer/order-cookie";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

function messageKeyFor(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  const code = error.code ?? "";

  if (code === "invalid_credentials") return "invalidCredentials";
  if (code === "user_already_exists" || code === "email_exists") {
    return "emailTaken";
  }
  if (code === "weak_password") return "weakPassword";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "rateLimited";
  }
  if (error.status === 429) return "rateLimited";

  return "serverError";
}

async function claimOrders(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("claim_guest_orders");

  for (const token of await rememberedOrderTokens()) {
    await supabase.rpc("link_order_to_customer", { p_token: token });
  }
}

export async function customerSignInAction(
  _previous: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const locale = field(formData, "locale") || "fr";
  const slug = field(formData, "slug");

  const parsed = loginSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured() || !slug) {
    return { status: "error", messageKey: "serverError" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  await claimOrders();
  revalidatePath("/", "layout");
  redirect(`/${locale}/store/${slug}/account`);
}

export async function customerSignUpAction(
  _previous: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const locale = field(formData, "locale") || "fr";
  const slug = field(formData, "slug");

  const parsed = registerSchema.safeParse({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    consent: field(formData, "consent") === "on",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured() || !slug) {
    return { status: "error", messageKey: "serverError" };
  }

  const supabase = await createClient();
  const next = `/${locale}/store/${slug}/account`;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Confirmation d'e-mail active : session ouverte seulement après validation.
  if (!data.session) {
    return { status: "check-email", email: parsed.data.email };
  }

  await claimOrders();
  revalidatePath("/", "layout");
  redirect(next);
}

export async function customerSignOutAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const slug = field(formData, "slug");

  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect(slug ? `/${locale}/store/${slug}/account/login` : `/${locale}`);
}
