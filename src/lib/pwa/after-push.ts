import { after } from "next/server";
import { drainDeliveryPush } from "@/lib/pwa/send";

/**
 * Envoie les notifications de course juste après la réponse HTTP.
 *
 * `after` ne retarde ni le webhook de paiement ni l'action du livreur. Le
 * drainage est protégé par son propre try/catch : une panne push ne doit jamais
 * faire échouer un encaissement ou un dispatch.
 */
export function afterDeliveryPush(): void {
  after(async () => {
    try {
      await drainDeliveryPush();
    } catch (error) {
      console.error("[push] drain crashed", error);
    }
  });
}
