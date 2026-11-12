import type { SasPayError } from "@/lib/payments/saspay/client";

/**
 * Message marchand à partir d'un refus SasPay.
 *
 * On ne montre jamais le corps brut : on traduit les cas fréquents et, à
 * défaut, on reprend le détail renvoyé par SasPay, tronqué.
 */
export function saspayUserMessage(error: SasPayError): string {
  const text = `${error.code} ${error.message}`.toLowerCase();

  if (/idempot|duplicate|conflict|409/.test(text)) {
    return "Une recharge précédente est encore en cours. Attends quelques minutes puis réessaie.";
  }
  if (/phone|msisdn|num[eé]ro|invalid/.test(text)) {
    return "Le numéro Mobile Money est invalide ou n’est pas reconnu par l’opérateur.";
  }
  if (/insufficient|balance|solde|funds/.test(text)) {
    return "Solde insuffisant sur ce compte Mobile Money.";
  }
  if (/unavailable|network|operator|op[eé]rateur|down/.test(text)) {
    return "Ce réseau Mobile Money est momentanément indisponible. Essaie un autre opérateur.";
  }

  const detail = error.message.trim();
  return detail
    ? `SasPay a refusé le paiement : ${detail.slice(0, 180)}`
    : "SasPay a refusé le paiement. Essaie un autre opérateur.";
}
