import type {
  CheckoutBrand,
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/lib/payments/types";
import type {
  SasPayPayinRate,
  SasPayPayinTier,
} from "@/lib/payments/saspay/client";
import { currencyDecimals } from "@/lib/fx/currency";

type BrandRule = {
  match: string;
  method: PaymentMethod;
  color: string;
  short: string;
};

/**
 * Catalogue des marques, verrouillé par la plateforme.
 *
 * Le marchand ne peut ni ajouter un réseau ni changer son logo : la couleur et
 * le sigle viennent d'ici, le nom vient de SasPay (`network_name`).
 */
const BRANDS: BrandRule[] = [
  { match: "orange_", method: "orange_money", color: "#FF7900", short: "OM" },
  { match: "moov_", method: "moov_money", color: "#F58220", short: "MO" },
  { match: "mtn_", method: "mtn_money", color: "#FFCC00", short: "MTN" },
  { match: "wave_", method: "wave", color: "#1DC8FF", short: "W" },
  { match: "djamo", method: "mobile_money", color: "#101828", short: "d" },
  { match: "celtiis", method: "mobile_money", color: "#7A2E8E", short: "C" },
  { match: "airtel", method: "mobile_money", color: "#E40000", short: "A" },
  { match: "free", method: "mobile_money", color: "#00A0E3", short: "F" },
  { match: "wizall", method: "mobile_money", color: "#00A651", short: "WZ" },
  { match: "expresso", method: "mobile_money", color: "#00AEEF", short: "E" },
  { match: "tigo", method: "mobile_money", color: "#0033A0", short: "AT" },
  { match: "vodafone", method: "mobile_money", color: "#E60000", short: "VF" },
  { match: "togo", method: "mobile_money", color: "#FFCC00", short: "TM" },
  { match: "mobi", method: "mobile_money", color: "#0055A4", short: "MC" },
  { match: "m_pesa", method: "mobile_money", color: "#43B02A", short: "MP" },
  { match: "vodacom", method: "mobile_money", color: "#E60000", short: "V" },
  { match: "afrimoney", method: "mobile_money", color: "#F5A623", short: "AF" },
  { match: "card", method: "card", color: "#1F2937", short: "CB" },
];

const FALLBACK_BRAND: CheckoutBrand = { color: "#334155", short: "MM" };

function ruleFor(code: string): BrandRule | null {
  const normalized = code.toLowerCase();
  return BRANDS.find((rule) => normalized.startsWith(rule.match)) ?? null;
}

export function brandFor(code: string, name?: string): CheckoutBrand {
  const rule = ruleFor(code);
  if (rule) return { color: rule.color, short: rule.short };

  const initials = (name ?? code)
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return { ...FALLBACK_BRAND, short: initials || FALLBACK_BRAND.short };
}

export function methodForNetwork(code: string): PaymentMethod {
  return ruleFor(code)?.method ?? "mobile_money";
}

/** Frais du réseau pour un montant donné, en unité mineure. */
export function networkFeeMinor(
  amountMinor: number,
  currency: string,
  tiers?: SasPayPayinTier[],
): number {
  if (!tiers || tiers.length === 0) return 0;

  const decimals = currencyDecimals(currency);
  const major = amountMinor / 10 ** decimals;

  const tier =
    tiers.find((entry) => {
      const min = entry.min_amount == null ? 0 : Number(entry.min_amount);
      const max =
        entry.max_amount == null ? Number.POSITIVE_INFINITY : Number(entry.max_amount);
      return major >= min && major <= max;
    }) ?? null;

  if (!tier) return 0;

  let fee =
    (major * Number(tier.percent ?? 0)) / 100 + Number(tier.fixed ?? 0);

  const floor = Number(tier.floor_amount ?? 0);
  if (floor > 0) fee = Math.max(fee, floor);

  if (tier.cap_amount != null) {
    const cap = Number(tier.cap_amount);
    if (Number.isFinite(cap)) fee = Math.min(fee, cap);
  }

  return Math.max(0, Math.round(fee * 10 ** decimals));
}

/** Option construite depuis la grille réelle SasPay (`/pricing/my-rates/`). */
export function optionFromRate(
  rate: SasPayPayinRate,
  provider: "saspay" | "mock",
  amountMinor = 0,
  chargeFee = false,
): CheckoutPaymentOption {
  const method = methodForNetwork(rate.network_code);
  const isCard = method === "card";

  return {
    code: rate.network_code,
    method,
    provider,
    kind: isCard ? "card" : "mobile_money",
    label: rate.network_name,
    brand: brandFor(rate.network_code, rate.network_name),
    requiresPhone: !isCard,
    requiresCard: isCard,
    requiresOtp: Boolean(rate.payin?.otp_required),
    otpInstructions: rate.payin?.otp_instructions?.trim() || undefined,
    clientFeeMinor: chargeFee
      ? networkFeeMinor(amountMinor, rate.currency, rate.payin?.tiers)
      : 0,
  };
}

const FAMILY_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_money: "MTN MoMo",
  moov_money: "Moov Money",
  mobile_money: "Mobile Money",
  card: "Carte bancaire",
};

/** Repli quand SasPay n'est pas joignable : mêmes familles, sans logos réels. */
export function fallbackOption(
  method: PaymentMethod,
  provider: "saspay" | "mock",
): CheckoutPaymentOption {
  const isCard = method === "card";

  return {
    code: method,
    method,
    provider,
    kind: isCard ? "card" : "mobile_money",
    label: FAMILY_LABELS[method] ?? method,
    brand: brandFor(method),
    requiresPhone: !isCard,
    requiresCard: isCard,
    requiresOtp: false,
    clientFeeMinor: 0,
  };
}

export function codOption(): CheckoutPaymentOption {
  return {
    code: "cod",
    method: "cod",
    provider: "cod",
    kind: "cod",
    label: "",
    brand: { color: "#334155", short: "COD" },
    requiresPhone: false,
    requiresCard: false,
    requiresOtp: false,
    clientFeeMinor: 0,
  };
}
