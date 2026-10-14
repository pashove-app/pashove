/**
 * Données structurelles de la vitrine : uniquement ce qui ne se traduit pas
 * (noms de marque, couleurs, codes pays, clés d'icônes).
 * Tout le texte vit dans `src/i18n/dictionaries`.
 */

export type PaymentMethod = {
  name: string;
  /** Clé de catégorie, résolue via `dict.payments.kinds`. */
  kind: "mobileMoney" | "wallet" | "card";
  color: string;
  /** Initiales affichées dans la pastille (aucun logo tiers n'est utilisé). */
  short: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { name: "Orange Money", kind: "mobileMoney", color: "#FF7900", short: "OM" },
  { name: "Wave", kind: "mobileMoney", color: "#1DC8FF", short: "W" },
  { name: "MTN MoMo", kind: "mobileMoney", color: "#FFCC00", short: "MM" },
  { name: "Moov Money", kind: "mobileMoney", color: "#0B5FBE", short: "Mo" },
  { name: "M-Pesa", kind: "mobileMoney", color: "#E60000", short: "MP" },
  { name: "Wizall", kind: "wallet", color: "#00A651", short: "Wz" },
  { name: "E-Money", kind: "wallet", color: "#7C3AED", short: "EM" },
  { name: "Coris Money", kind: "mobileMoney", color: "#F5A623", short: "CM" },
  { name: "Celtiis Cash", kind: "mobileMoney", color: "#00B0B9", short: "CC" },
  { name: "Free Money", kind: "mobileMoney", color: "#E2001A", short: "FM" },
  { name: "Airtel Money", kind: "mobileMoney", color: "#ED1C24", short: "AM" },
  { name: "Visa", kind: "card", color: "#1A1F71", short: "VI" },
  { name: "Mastercard", kind: "card", color: "#EB001B", short: "MC" },
];

/** Opérateurs mis en avant dans l'accroche (le dernier est la carte bancaire). */
export const HEADLINE_METHODS = PAYMENT_METHODS.slice(0, 5).map((m) => m.name);

/** Passerelles agrégées derrière une seule intégration. */
export const GATEWAYS = ["Flutterwave", "CinetPay", "PayDunya"] as const;

export type CountryRef = { flag: string; code: string };

export const LAUNCH_COUNTRIES: CountryRef[] = [
  { flag: "🇸🇳", code: "SN" },
  { flag: "🇨🇮", code: "CI" },
  { flag: "🇲🇱", code: "ML" },
  { flag: "🇧🇫", code: "BF" },
  { flag: "🇧🇯", code: "BJ" },
  { flag: "🇹🇬", code: "TG" },
  { flag: "🇳🇪", code: "NE" },
  { flag: "🇬🇼", code: "GW" },
];

export const NEXT_COUNTRIES: CountryRef[] = [
  { flag: "🇨🇲", code: "CM" },
  { flag: "🇬🇳", code: "GN" },
  { flag: "🇨🇩", code: "CD" },
  { flag: "🇬🇦", code: "GA" },
  { flag: "🇨🇬", code: "CG" },
  { flag: "🇹🇩", code: "TD" },
  { flag: "🇬🇭", code: "GH" },
  { flag: "🇳🇬", code: "NG" },
  { flag: "🇰🇪", code: "KE" },
  { flag: "🇹🇿", code: "TZ" },
  { flag: "🇷🇼", code: "RW" },
  { flag: "🇲🇬", code: "MG" },
];

/* ------------------------------------------------------------------ *
 *  Démonstrateur multi-pays (section « International »)
 * ------------------------------------------------------------------ */

export type MarketDemo = {
  code: string;
  flag: string;
  currency: string;
  /** Langue que verrait le client de ce marché. */
  uiLocale: "fr" | "en" | "bm" | "ln" | "ar";
  /** Prix du même article, converti dans la devise locale. */
  amount: number;
  /** Trois formules de livraison, dans la devise locale. */
  shippingRates: [number, number, number];
};

/**
 * Marchés de la démonstration. Les montants sont des ordres de grandeur
 * convertis à la main — à recalculer sur des taux réels avant publication.
 */
export const MARKET_DEMO: MarketDemo[] = [
  { code: "SN", flag: "🇸🇳", currency: "XOF", uiLocale: "fr", amount: 25_000, shippingRates: [1_500, 3_500, 1_000] },
  { code: "ML", flag: "🇲🇱", currency: "XOF", uiLocale: "bm", amount: 25_000, shippingRates: [1_500, 3_500, 1_000] },
  { code: "CI", flag: "🇨🇮", currency: "XOF", uiLocale: "fr", amount: 25_000, shippingRates: [1_200, 3_000, 900] },
  { code: "CM", flag: "🇨🇲", currency: "XAF", uiLocale: "fr", amount: 25_000, shippingRates: [1_500, 3_500, 1_000] },
  { code: "GH", flag: "🇬🇭", currency: "GHS", uiLocale: "en", amount: 590, shippingRates: [35, 80, 25] },
  { code: "CD", flag: "🇨🇩", currency: "CDF", uiLocale: "ln", amount: 118_000, shippingRates: [7_000, 15_000, 5_000] },
];

/**
 * Formatage des montants. On garde les chiffres latins et l'espace fine
 * insécable du français dans toutes les langues : c'est ce que la vitrine
 * affiche partout ailleurs, et ça évite que l'arabe bascule en chiffres
 * indo-arabes au milieu d'une maquette.
 */
const AMOUNT_FORMAT = new Intl.NumberFormat("fr-FR");

export function formatAmount(value: number): string {
  return AMOUNT_FORMAT.format(value);
}

/**
 * Libellés du bouton d'achat tels que le CLIENT les voit, par langue de marché.
 * Ce n'est pas de la copie de site : c'est la donnée de la démonstration —
 * elle montre que la page de paiement parle la langue de l'acheteur.
 */
export const MARKET_CTA: Record<MarketDemo["uiLocale"], string> = {
  fr: "Ajouter au panier",
  en: "Add to basket",
  bm: "Fara a kan",
  ln: "Bakisa na ekolo",
  ar: "أضف إلى السلة",
};

/** Comptes de retrait animés (couleurs de marque, noms non traduits). */
export const PAYOUT_ACCOUNTS = [
  { name: "Orange Money", short: "OM", color: "#FF7900" },
  { name: "Wave", short: "W", color: "#1DC8FF" },
  { name: "MTN MoMo", short: "MM", color: "#FFCC00" },
];

/** Compte affiché dans l'écran de confirmation du téléphone. */
export const DEMO_OPERATOR = { name: "Orange Money", short: "OM", color: "#FF7900" };

/** Icônes du méga-menu, appariées par index avec `mega.columns[].items[]`. */
export const MEGA_ICONS = [
  ["bag", "box", "download", "calendar"],
  ["wallet", "route", "lock", "key"],
  ["gift", "users", "chart", "shield"],
] as const;

/** Clés d'icônes, appariées par index avec les tableaux du dictionnaire. */
export const ICON_KEYS = {
  highlight: ["route", "bolt", "wallet"],
  productType: ["box", "download", "calendar"],
  storePoints: ["check", "globe", "chart"],
  capability: ["palette", "gift", "users", "chart"],
  withdraw: ["bolt", "key", "bell"],
  security: ["lock", "wallet", "shield", "key"],
  developer: ["code", "webhook", "lock", "clock"],
  platform: ["bag", "users", "route"],
} as const;

/** Répartition à l'encaissement (exemple illustratif, en pourcentage). */
export const SPLIT_RATIOS = [96, 3, 1] as const;

/** Journal affiché dans la section « registre immuable ». */
export const LEDGER_ROWS = [
  { id: "ENT-9021", amount: "+25 000", positive: true, at: "14:02:11" },
  { id: "ENT-9022", amount: "−250", positive: false, at: "14:02:11" },
  { id: "ENT-9023", amount: "+24 000", positive: true, at: "14:02:12" },
  { id: "ENT-9024", amount: "−40 000", positive: false, at: "14:31:07" },
] as const;

export const CURL_SAMPLE = `curl https://api.pashove.com/v1/payments \\
  -H "Authorization: Bearer sk_live_…" \\
  -H "Idempotency-Key: 8f42kd91" \\
  -d amount=25000 \\
  -d currency=XOF \\
  -d country=SN \\
  -d method=orange_money \\
  -d phone="+221771234567"`;

export const WEBHOOK_SAMPLE = `{
  "event": "payment.succeeded",
  "id": "evt_8f42kd",
  "created": 1780762931,
  "data": {
    "reference": "PSH-8F42-KD",
    "amount": 25000,
    "currency": "XOF",
    "gateway": "cinetpay",
    "fee": 750,
    "store_id": "str_91af2c"
  }
}`;

/** Adresses de contact (non traduites). */
export const CONTACT_EMAILS = [
  "hello@pashove.com",
  "support@pashove.com",
  "billing@pashove.com",
  "security@pashove.com",
] as const;

export const SITE_URL = "https://pashove.com";
