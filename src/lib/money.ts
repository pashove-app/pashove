/**
 * Mise en forme d'un montant, côté serveur.
 *
 * Le franc CFA n'a pas de sous-unité : on n'affiche jamais de décimales pour
 * XOF. La mise en forme reste sur le serveur pour que l'hydratation ne dépende
 * pas des données ICU du navigateur.
 */
export function formatMoney(
  amount: number,
  currency: string,
  localeTag: string,
): string {
  try {
    return new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
