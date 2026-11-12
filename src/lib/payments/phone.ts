/**
 * Normalisation des numéros Mobile Money au format international.
 *
 * SasPay exige un numéro joignable par l'opérateur. Un numéro local
 * (« 71 36 68 04 ») doit être préfixé par l'indicatif du pays de la boutique ;
 * un numéro déjà international est conservé. On ne devine jamais le pays à
 * partir du numéro : c'est le marché qui fait foi.
 */
const DIAL_CODES: Record<string, string> = {
  AO: "244",
  BF: "226",
  BJ: "229",
  CD: "243",
  CF: "236",
  CG: "242",
  CI: "225",
  CM: "237",
  CV: "238",
  GA: "241",
  GH: "233",
  GM: "220",
  GN: "224",
  GQ: "240",
  GW: "245",
  LR: "231",
  ML: "223",
  MR: "222",
  NE: "227",
  NG: "234",
  SL: "232",
  SN: "221",
  ST: "239",
  TD: "235",
  TG: "228",
};

export function normalizePaymentPhone(
  raw: string,
  country: string,
): string | null {
  const value = raw.trim();
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  // Numéro déjà international.
  if (value.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;

  const dial = DIAL_CODES[country.trim().toUpperCase()];
  if (!dial) return `+${digits}`;

  // Indicatif déjà présent sans le « + ».
  if (digits.startsWith(dial)) return `+${digits}`;

  // Numéro local : on retire le zéro de tête et on ajoute l'indicatif.
  return `+${dial}${digits.replace(/^0+/, "")}`;
}
