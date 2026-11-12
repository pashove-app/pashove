import type {
  PaymentConfirmation,
  PaymentIntent,
  PaymentProviderCode,
} from "@/lib/payments/types";
import type {
  CreateIntentInput,
  PaymentProvider,
  WebhookResult,
} from "@/lib/payments/provider";

/** Erreur normalisée d'un fournisseur, utilisable par le routeur. */
export class PaymentProviderError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 0, message?: string) {
    super(message ?? code);
    this.name = "PaymentProviderError";
    this.code = code;
    this.status = status;
  }
}

export type RoutedProvider = {
  code: PaymentProviderCode;
  provider: PaymentProvider;
};

/**
 * Une erreur mérite-t-elle d'essayer le fournisseur suivant ?
 *
 * Un refus métier (numéro invalide, solde insuffisant, 4xx) ne doit jamais
 * être rejoué chez un concurrent : la demande est incorrecte, pas le PSP.
 * Seules les pannes de transport, les délais et les 5xx/429 déclenchent le
 * basculement.
 */
export function isFailoverError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error ? String(error.code ?? "") : "";
  if (
    /timeout|unreachable|econn(reset|refused|aborted)|etimedout|enotfound|eai_again|abort/i.test(
      code,
    )
  ) {
    return true;
  }

  const status = "status" in error ? Number(error.status) : 0;
  return status === 429 || (Number.isFinite(status) && status >= 500);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const boundary = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new PaymentProviderError("timeout", 0, "Provider timed out")),
      ms,
    );
  });

  try {
    return await Promise.race([promise, boundary]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Routeur multi-PSP.
 *
 * Le premier fournisseur est prioritaire. En cas de panne technique seulement,
 * l'intention est recréée chez le suivant avec la même clé d'idempotence.
 * Chaque fournisseur peut interpréter cette clé à sa façon : elle reste stable
 * pour une même tentative de paiement.
 */
export class PaymentProviderRouter {
  private readonly entries: RoutedProvider[];
  private readonly timeoutMs: number;

  constructor(entries: RoutedProvider[], timeoutMs = 9000) {
    if (entries.length === 0) {
      throw new PaymentProviderError("provider_not_configured", 503);
    }
    this.entries = entries;
    this.timeoutMs = timeoutMs;
  }

  get primary(): RoutedProvider {
    return this.entries[0];
  }

  providerFor(code: string): PaymentProvider {
    const entry = this.entries.find((candidate) => candidate.code === code);
    if (!entry) throw new PaymentProviderError("provider_not_configured", 503);
    return entry.provider;
  }

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    let lastError: unknown;

    for (let index = 0; index < this.entries.length; index += 1) {
      const entry = this.entries[index];

      try {
        const intent = await withTimeout(
          entry.provider.createIntent(input),
          this.timeoutMs,
        );

        // Le fournisseur retenu est celui de la route, pas celui annoncé par
        // une réponse incohérente.
        return { ...intent, provider: entry.code };
      } catch (error) {
        lastError = error;
        const isLast = index === this.entries.length - 1;
        if (!isFailoverError(error) || isLast) throw error;
      }
    }

    throw lastError ?? new PaymentProviderError("provider_unavailable", 503);
  }

  async confirm(intent: PaymentIntent): Promise<PaymentConfirmation> {
    return this.providerFor(intent.provider).confirm(intent);
  }

  async handleWebhook(
    code: string,
    payload: string,
    signature: string | null,
  ): Promise<WebhookResult> {
    return this.providerFor(code).handleWebhook(payload, signature);
  }
}
