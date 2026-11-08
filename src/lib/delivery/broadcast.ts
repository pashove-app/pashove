/**
 * Diffusion de la position du livreur aux clients qui suivent la commande.
 *
 * Supabase Realtime Broadcast est utilisé plutôt que Postgres Changes : la
 * page de suivi est anonyme et le jeton public de la commande sert de capacité.
 * Le message part du serveur avec la clé de service ; le navigateur ne peut
 * pas publier de position.
 */

export type BroadcastLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
};

export async function broadcastDeliveryLocation(
  orderToken: string,
  location: BroadcastLocation,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || !orderToken) return false;

  try {
    const response = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `tracking:${orderToken}`,
            event: "location",
            payload: location,
            private: false,
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn("[tracking] broadcast failed", {
        status: response.status,
      });
      return false;
    }

    return true;
  } catch {
    // Le suivi continue par polling côté client ; une diffusion manquée ne
    // doit jamais bloquer la course.
    return false;
  }
}
