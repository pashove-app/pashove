/**
 * Client HTTP SasPay (serveur uniquement).
 *
 * Chemins et champs conformes à la spécification OpenAPI 1.0.0 :
 * https://docs.saspay.me/api-reference/openapi.json
 *
 * Aucun chemin n'est deviné : `/wallets/` et `/payments/` n'existent pas.
 */

export type SasPayNetwork = {
  id: string;
  country: string;
  code: string;
  name: string;
  is_active: boolean;
};

export type SasPayCountry = {
  id: string;
  iso_code: string;
  name: string;
  currency: string;
};

export type SasPayPayment = {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | string;
  checkout_url?: string | null;
  message?: string;
  [key: string]: unknown;
};

export type SasPayPayinRate = {
  country_code: string;
  country_name?: string;
  currency: string;
  network_code: string;
  network_name: string;
  payin: {
    available: boolean;
    otp_required: boolean;
    otp_instructions?: string;
  };
};

export type SasPayExchangeRate = {
  from_currency: string;
  to_currency: string;
  rate: string;
  auto_update?: boolean;
};

export type SasPayBalance = {
  id: string;
  merchant: string;
  country: string;
  currency: string;
  available_amount: string;
  pending_amount: string;
  is_frozen: boolean;
};

export class SasPayError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "SasPayError";
    this.code = code;
    this.status = status;
  }
}

const BASE_URL = (
  process.env.SASPAY_BASE_URL ?? "https://api.saspay.me/api/v1"
).replace(/\/$/, "");

const TIMEOUT_MS = 15_000;
const NETWORK_TTL_MS = 10 * 60 * 1000;

export function saspayConfigured(): boolean {
  return Boolean(process.env.SASPAY_API_KEY?.trim());
}

function apiKey(): string {
  const key = process.env.SASPAY_API_KEY?.trim();
  if (!key) throw new SasPayError("saspay_not_configured", 0, "SASPAY_API_KEY absente");
  return key;
}

/** L'API répond tantôt à plat, tantôt sous `{ success, data }`. */
function unwrap(payload: unknown): unknown {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function listOf<T>(payload: unknown): T[] {
  const value = unwrap(payload) as { results?: unknown } | unknown[] | null;
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown }).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const body = payload as {
        message?: string;
        code?: string | number;
        error?: { detail?: string; code?: string };
      } | null;

      throw new SasPayError(
        String(body?.error?.code ?? body?.code ?? "saspay_error"),
        response.status,
        body?.error?.detail ?? body?.message ?? response.statusText,
      );
    }

    return unwrap(payload) as T;
  } catch (error) {
    if (error instanceof SasPayError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SasPayError("saspay_timeout", 0, "SasPay n'a pas répondu à temps");
    }
    throw new SasPayError("saspay_unreachable", 0, "SasPay est injoignable");
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ *
 *  Référentiels (mis en cache par instance)
 * ------------------------------------------------------------------ */

let networkCache: { at: number; value: SasPayNetwork[] } | null = null;
let countryCache: { at: number; value: SasPayCountry[] } | null = null;

export async function listNetworks(): Promise<SasPayNetwork[]> {
  const now = Date.now();
  if (networkCache && now - networkCache.at < NETWORK_TTL_MS) return networkCache.value;

  const value = listOf<SasPayNetwork>(await request("/networks/?page_size=100"));
  networkCache = { at: now, value };
  return value;
}

export async function listCountries(): Promise<SasPayCountry[]> {
  const now = Date.now();
  if (countryCache && now - countryCache.at < NETWORK_TTL_MS) return countryCache.value;

  const value = listOf<SasPayCountry>(await request("/countries/"));
  countryCache = { at: now, value };
  return value;
}

const NETWORK_PREFIX: Record<string, string> = {
  orange_money: "orange_",
  wave: "wave_",
  mtn_money: "mtn_",
  moov_money: "moov_",
};

/**
 * Traduit un moyen Pashove en code réseau SasPay pour un pays donné.
 *
 * Aucun code n'est codé en dur : la liste vient de `/networks/`, dont le champ
 * `country` est l'UUID du pays — d'où le détour par `/countries/`.
 */
export async function resolveNetwork(
  method: string,
  country: string,
): Promise<string> {
  const iso = country.trim().toUpperCase();

  if (method === "card") {
    const networks = await listNetworks();
    const card = networks.find((entry) => entry.code === "card" && entry.is_active !== false);
    return card?.code ?? "card";
  }

  const prefix = NETWORK_PREFIX[method];
  if (!prefix) {
    throw new SasPayError("network_unsupported", 422, `Moyen inconnu : ${method}`);
  }

  const [countries, networks] = await Promise.all([listCountries(), listNetworks()]);
  const countryId = countries.find((entry) => entry.iso_code?.toUpperCase() === iso)?.id;

  const candidates = networks
    .filter((entry) => entry.is_active !== false)
    .filter((entry) => entry.code.startsWith(prefix))
    .filter((entry) =>
      countryId ? entry.country === countryId : entry.code.endsWith(`_${iso.toLowerCase()}`),
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  if (candidates.length === 0) {
    throw new SasPayError(
      "network_unavailable",
      422,
      `Aucun réseau ${prefix.replace("_", " ")} actif pour ${iso}`,
    );
  }

  return candidates[0].code;
}

/* ------------------------------------------------------------------ *
 *  Paiements
 * ------------------------------------------------------------------ */

/**
 * Les montants Pashove sont des entiers dans l'unité de la devise (XOF sans
 * décimale) ; SasPay attend une chaîne décimale à deux décimales.
 */
export function formatAmount(amountMinor: number, currency: string): string {
  const decimals = currency.trim().toUpperCase() === "XOF" ||
    currency.trim().toUpperCase() === "XAF" ||
    currency.trim().toUpperCase() === "GNF" ||
    currency.trim().toUpperCase() === "UGX" ||
    currency.trim().toUpperCase() === "RWF"
    ? 0
    : 2;
  return (amountMinor / 10 ** decimals).toFixed(2);
}

export type CreateSoftpayInput = {
  amount: number;
  currency: string;
  country: string;
  network: string;
  description?: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  otp?: string;
  idempotencyKey: string;
};

export async function createSoftpay(input: CreateSoftpayInput): Promise<SasPayPayment> {
  const payment = await request<SasPayPayment>("/payments/softpay/", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      amount: formatAmount(input.amount, input.currency),
      currency: input.currency,
      country: input.country,
      network: input.network,
      description: input.description,
      customer: input.customer,
      metadata: input.metadata,
      ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
      ...(input.otp ? { otp: input.otp } : {}),
    }),
  });

  if (!payment?.id) {
    throw new SasPayError("saspay_bad_response", 502, "Réponse SasPay sans identifiant");
  }

  return payment;
}

export async function verifyPayment(paymentId: string): Promise<SasPayPayment> {
  return request<SasPayPayment>(`/payments/${paymentId}/verify/`);
}

export async function confirmOtp(paymentId: string, otp: string): Promise<SasPayPayment> {
  return request<SasPayPayment>(`/payments/${paymentId}/confirm-otp/`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

/** Tarifs et disponibilité réels, par pays et par réseau (inclut l'OTP). */
export async function listPayinRates(): Promise<SasPayPayinRate[]> {
  const value = await request<SasPayPayinRate[]>("/pricing/my-rates/");
  return Array.isArray(value) ? value : [];
}

let exchangeCache: { at: number; value: SasPayExchangeRate[] } | null = null;

/** Taux de conversion entre devises (paires fournies par SasPay). */
export async function listExchangeRates(): Promise<SasPayExchangeRate[]> {
  const now = Date.now();
  if (exchangeCache && now - exchangeCache.at < NETWORK_TTL_MS) {
    return exchangeCache.value;
  }

  const all: SasPayExchangeRate[] = [];

  for (let page = 1; page <= 5; page += 1) {
    const payload = await request<
      { results?: SasPayExchangeRate[]; next?: string | null } | SasPayExchangeRate[]
    >(`/exchange-rates/?page=${page}&page_size=100`);

    const rows = Array.isArray(payload) ? payload : (payload.results ?? []);
    all.push(...rows);

    const next = Array.isArray(payload) ? null : payload.next;
    if (!next || rows.length === 0) break;
  }

  exchangeCache = { at: now, value: all };
  return all;
}

/**
 * Parcourt toutes les pages de `/exchange-rates/` (≈ 9 000 paires, 91 pages).
 * Réservé au cron de synchronisation : jamais appelé au checkout.
 */
export async function listAllExchangeRates(): Promise<SasPayExchangeRate[]> {
  const collect = async (page: number): Promise<SasPayExchangeRate[]> => {
    const payload = await request<
      { results?: SasPayExchangeRate[]; next?: string | null } | SasPayExchangeRate[]
    >(`/exchange-rates/?page=${page}&page_size=100`);
    return Array.isArray(payload) ? payload : (payload.results ?? []);
  };

  const all: SasPayExchangeRate[] = [...(await collect(1))];
  let page = 2;

  while (page <= 150) {
    const pages = Array.from({ length: 8 }, (_, index) => page + index);
    const batch = await Promise.all(
      pages.map((value) => collect(value).catch(() => [] as SasPayExchangeRate[])),
    );

    let reachedEnd = false;
    for (const rows of batch) {
      if (rows.length === 0) {
        reachedEnd = true;
        break;
      }
      all.push(...rows);
    }

    if (reachedEnd) break;
    page += 8;
  }

  return all;
}

export async function listBalances(): Promise<SasPayBalance[]> {
  return listOf<SasPayBalance>(await request("/merchant-balances/?page=1&page_size=100"));
}

/* ------------------------------------------------------------------ *
 *  Webhook : signature
 * ------------------------------------------------------------------ */

export function webhookSecret(): string | null {
  const secret = process.env.SASPAY_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}

export const WEBHOOK_TOLERANCE_SECONDS = 300;
