import { createPublicClient } from "@/lib/supabase/public";

/**
 * Client DeepSeek du Studio.
 *
 * Le coût réel est calculé à partir des tokens réellement consommés, puis
 * converti en FCFA avec le taux USD/XOF de la base. Aucun prix n'est décidé
 * côté client.
 */

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DeepSeekUsage = {
  promptTokens: number;
  completionTokens: number;
  promptCacheMissTokens: number;
  promptCacheHitTokens: number;
};

export type DeepSeekResult = {
  content: string;
  model: string;
  usage: DeepSeekUsage;
};

/** Tarifs DeepSeek (USD par million de tokens), x10 de la grille publique. */
export const DEEPSEEK_INPUT_USD_PER_MILLION = 1.2;
export const DEEPSEEK_OUTPUT_USD_PER_MILLION = 4.8;

/** Repli si le taux n'est pas disponible : dernier taux constaté. */
const USD_XOF_FALLBACK = 568.08;
const RATE_TTL_MS = 30 * 60 * 1000;

let rateCache: { rate: number; at: number } | null = null;

export class DeepSeekError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function usdToXofRate(): Promise<number> {
  if (rateCache && Date.now() - rateCache.at < RATE_TTL_MS) {
    return rateCache.rate;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("public_fx_rate", {
      p_from: "USD",
      p_to: "XOF",
    });

    const rate = Number(data);

    if (!error && Number.isFinite(rate) && rate > 0) {
      rateCache = { rate, at: Date.now() };
      return rate;
    }
  } catch {
    // On garde le repli.
  }

  console.warn("[studio] USD/XOF rate unavailable, using fallback");
  return USD_XOF_FALLBACK;
}

/** Coût réel en FCFA, arrondi au franc supérieur, jamais négatif. */
export function deepSeekCostFcfa(
  usage: DeepSeekUsage,
  usdToXof: number,
): number {
  const inputTokens =
    usage.promptCacheMissTokens > 0
      ? usage.promptCacheMissTokens
      : usage.promptTokens;
  const usd =
    (inputTokens / 1_000_000) * DEEPSEEK_INPUT_USD_PER_MILLION +
    (usage.completionTokens / 1_000_000) * DEEPSEEK_OUTPUT_USD_PER_MILLION;

  if (usd <= 0) return 0;

  return Math.max(1, Math.ceil(usd * usdToXof));
}

function endpoint(): string {
  const base = (
    process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
  ).replace(/\/+$/, "");
  return `${base}/chat/completions`;
}

export async function deepSeekChat(
  messages: DeepSeekMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<DeepSeekResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new DeepSeekError("not_configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 900,
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new DeepSeekError(
        `http_${response.status}`,
        text.slice(0, 300) || `DeepSeek HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        prompt_cache_miss_tokens?: number;
        prompt_cache_hit_tokens?: number;
      };
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new DeepSeekError("empty_response");

    const usage = payload.usage ?? {};

    return {
      content,
      model: payload.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      usage: {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        promptCacheMissTokens: usage.prompt_cache_miss_tokens ?? 0,
        promptCacheHitTokens: usage.prompt_cache_hit_tokens ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof DeepSeekError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new DeepSeekError("timeout");
    }
    throw new DeepSeekError(
      "network",
      error instanceof Error ? error.message : undefined,
    );
  } finally {
    clearTimeout(timeout);
  }
}
