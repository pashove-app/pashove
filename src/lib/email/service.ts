import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";
import { renderEmail } from "./templates";
import { deliverEmail } from "./transport";
import type {
  EmailKind,
  EmailLocale,
  RenderedEmail,
  SendEmailInput,
} from "./types";

export function toEmailLocale(value?: string | null): EmailLocale {
  return value?.toLowerCase().startsWith("en") ? "en" : "fr";
}

type Recipient = {
  email: string;
  name: string | null;
  storeName: string | null;
  slug: string | null;
};

/** Écrit la trace d'un envoi dans la boîte d'envoi interne. */
async function record(
  input: SendEmailInput,
  rendered: RenderedEmail,
  result: Awaited<ReturnType<typeof deliverEmail>>,
): Promise<void> {
  const service = createServiceClient();
  if (!service) return;

  const now = new Date();
  const failed = !result.ok;

  try {
    await service.from("email_messages").insert({
      store_id: input.storeId ?? null,
      template: input.template,
      recipient: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text_body: rendered.text,
      status: failed ? "failed" : "sent",
      attempts: 1,
      last_error: result.error ?? null,
      provider: result.provider,
      provider_id: result.id ?? null,
      // Un échec repart dans la file au prochain passage du cron.
      scheduled_at: failed
        ? new Date(now.getTime() + 5 * 60 * 1000).toISOString()
        : now.toISOString(),
      sent_at: failed ? null : now.toISOString(),
    });
  } catch (error) {
    console.error("[email] outbox write failed", error);
  }
}

/**
 * Envoie un e-mail. Ne lève jamais : un e-mail manquant ne doit pas annuler
 * une commande ni une transition de statut.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    const to = input.to?.trim();
    if (!to || !to.includes("@")) return;

    const locale = toEmailLocale(input.locale);
    const rendered = renderEmail(input.template, input.data, locale);

    const result = await deliverEmail({
      to,
      toName: input.toName ?? null,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: input.template,
    });

    await record(input, rendered, result);
  } catch (error) {
    console.error("[email] send failed", error);
  }
}

/** Le marchand a-t-il laissé cette catégorie active ? Absence de ligne = oui. */
export async function storeNotificationEnabled(
  storeId: string,
  kind: EmailKind,
): Promise<boolean> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("store_email_preferences")
      .select("enabled")
      .eq("store_id", storeId)
      .eq("kind", kind)
      .maybeSingle();

    return (data as { enabled?: boolean } | null)?.enabled !== false;
  } catch {
    return true;
  }
}

/**
 * Destinataire des notifications marchand.
 *
 * On privilégie l'adresse de contact publique de la boutique — c'est celle que
 * le marchand a choisie pour son activité. À défaut seulement, on lit l'e-mail
 * du compte propriétaire, ce qui exige le service role.
 */
export async function merchantRecipient(
  storeId: string,
): Promise<Recipient | null> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("stores")
    .select("name, slug, contact_email")
    .eq("id", storeId)
    .maybeSingle();

  const store = data as
    | { name?: string; slug?: string; contact_email?: string | null }
    | null;

  let email = store?.contact_email?.trim() || null;

  if (!email) {
    const service = createServiceClient();
    if (service) {
      const { data: member } = await service
        .from("store_members")
        .select("user_id")
        .eq("store_id", storeId)
        .eq("role", "owner")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const userId = (member as { user_id?: string } | null)?.user_id;
      if (userId) {
        const { data: authUser } = await service.auth.admin.getUserById(userId);
        email = authUser?.user?.email ?? null;
      }
    }
  }

  if (!email) return null;

  return {
    email,
    name: store?.name ?? null,
    storeName: store?.name ?? null,
    slug: store?.slug ?? null,
  };
}

/**
 * Notifie le marchand, en respectant ses préférences.
 *
 * Sans destinataire joignable (pas d'adresse de contact, pas de service role),
 * l'envoi est ignoré et journalisé : mieux vaut un silence explicite qu'une
 * exception au milieu d'une commande.
 */
export async function sendStoreEmail(
  input: SendEmailInput & { kind: EmailKind },
): Promise<void> {
  try {
    if (!input.storeId) return;

    if (!(await storeNotificationEnabled(input.storeId, input.kind))) {
      return;
    }

    const recipient = await merchantRecipient(input.storeId);
    if (!recipient) {
      console.warn(
        `[email] no merchant recipient for store ${input.storeId} (${input.kind})`,
      );
      return;
    }

    await sendEmail({
      ...input,
      to: recipient.email,
      toName: recipient.name,
      data: {
        ...input.data,
        storeName: input.data.storeName ?? recipient.storeName,
        storeUrl: input.data.storeUrl ?? null,
      },
    });
  } catch (error) {
    console.error("[email] store notification failed", error);
  }
}
