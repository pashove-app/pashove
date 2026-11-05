/**
 * Transport des e-mails.
 *
 * Deux modes, choisis par l'environnement :
 *  - `brevo` : envoi réel par l'API Brevo (clé `BREVO_API_KEY`) ;
 *  - `log`   : écriture dans la console du serveur, aucun envoi. C'est le mode
 *              de développement par défaut tant qu'aucune clé n'est posée.
 *
 * `EMAIL_DRIVER=log` force le mode console même si une clé existe : utile pour
 * tester un parcours sans consommer de crédits ni risquer d'écrire à un vrai
 * destinataire.
 */

export type EmailDriver = "brevo" | "log";

export type DeliveryResult = {
  ok: boolean;
  provider: EmailDriver;
  id?: string;
  error?: string;
};

type DeliveryInput = {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text: string;
  template: string;
};

export function emailDriver(): EmailDriver {
  const forced = process.env.EMAIL_DRIVER?.trim().toLowerCase();
  if (forced === "log" || forced === "brevo") return forced;
  return process.env.BREVO_API_KEY ? "brevo" : "log";
}

export function isEmailConfigured(): boolean {
  return emailDriver() === "brevo" && Boolean(process.env.BREVO_API_KEY);
}

/** `"Pashove <noreply@pashove.com>"` → `{ name, email }`. */
function sender(): { name: string; email: string } {
  const raw = (process.env.EMAIL_FROM ?? "Pashove <noreply@pashove.com>").trim();
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  if (match && match[2]) {
    return { name: match[1] || "Pashove", email: match[2] };
  }

  return { name: "Pashove", email: raw };
}

function replyTo(): string | null {
  const value = process.env.EMAIL_REPLY_TO?.trim();
  return value || null;
}

export async function deliverEmail(
  input: DeliveryInput,
): Promise<DeliveryResult> {
  const driver = emailDriver();

  if (driver === "log") {
    console.info(
      `[email:log] ${input.template} → ${input.to} · ${input.subject}`,
    );

    if (process.env.NODE_ENV !== "production") {
      console.info(input.text.split("\n").slice(0, 14).join("\n"));
    }

    return { ok: true, provider: "log", id: `log_${Date.now()}` };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      provider: "brevo",
      error: "missing_api_key",
    };
  }

  const from = sender();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email: input.to, ...(input.toName ? { name: input.toName } : {}) }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        ...(replyTo() ? { replyTo: { email: replyTo()! } } : {}),
        tags: [input.template],
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        provider: "brevo",
        error: `brevo_${response.status}: ${raw.slice(0, 280)}`,
      };
    }

    let id: string | undefined;
    try {
      const parsed = JSON.parse(raw) as { messageId?: string };
      id = parsed.messageId;
    } catch {
      // Brevo répond parfois un corps vide sur les envois acceptés.
    }

    return { ok: true, provider: "brevo", id };
  } catch (error) {
    return {
      ok: false,
      provider: "brevo",
      error:
        error instanceof Error
          ? error.name === "AbortError"
            ? "timeout"
            : error.message
          : "unknown_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
