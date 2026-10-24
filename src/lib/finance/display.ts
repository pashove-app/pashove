import type { LedgerMovement } from "@/lib/finance/queries";

/**
 * Sens du mouvement pour le marchand.
 *
 * Une commission est une charge (négative) ; son annulation par un
 * remboursement est positive. Les retraits sortent du solde.
 */
export function signedAmount(movement: LedgerMovement): number {
  if (movement.kind === "commission") {
    return movement.role === "reversal" ? movement.amount : -movement.amount;
  }

  if (movement.kind === "refund") return -movement.amount;
  if (movement.kind === "payout_request" || movement.kind === "payout_paid") {
    return -movement.amount;
  }

  return movement.amount;
}
