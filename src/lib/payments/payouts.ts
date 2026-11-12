/**
 * Exécution des retraits.
 *
 * SasPay exige une IP whitelistée pour les payouts et les fonctions Vercel
 * n'ont pas d'IP fixe. Par défaut, le retrait reste donc **manuel** : un
 * opérateur exécute le versement chez SasPay puis marque le payout payé.
 *
 * Quand la whitelist sera validée (ou qu'un proxy à IP fixe sera disponible),
 * `SASPAY_PAYOUTS_ENABLED=true` activera l'adaptateur automatique.
 */
export type PayoutExecutionMode = "manual" | "saspay";

export function payoutExecutionMode(): PayoutExecutionMode {
  const enabled = process.env.SASPAY_PAYOUTS_ENABLED?.trim() === "true";
  return enabled && Boolean(process.env.SASPAY_API_KEY) ? "saspay" : "manual";
}

export async function executeProviderPayout(_input: {
  payoutId: string;
  amount: number;
  currency: string;
  phone: string;
  network: string;
}): Promise<{ status: "manual" | "sent"; reference?: string }> {
  if (payoutExecutionMode() === "manual") {
    return { status: "manual" };
  }

  // L'appel `/payouts/initialize/` sera branché après validation de la
  // whitelist IP. On ne simule pas un envoi d'argent réel.
  throw new Error("saspay_payout_not_implemented");
}
