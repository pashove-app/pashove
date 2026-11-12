/**
 * Adaptateur Smile Identity (préparation).
 *
 * Le mode `mock` permet de tester le parcours KYC sans compte Smile : il
 * renvoie une session locale et ne modifie pas le dossier. Le mode `live`
 * exige les clés Smile ; l'appel réel sera branché sur l'endpoint choisi
 * lorsque le compte partenaire sera disponible.
 */
export type SmileMode = "mock" | "live" | "disabled";

export function smileMode(): SmileMode {
  const mode = process.env.SMILE_IDENTITY_MODE?.trim().toLowerCase();
  if (mode === "live" && smileConfigured()) return "live";
  if (mode === "disabled") return "disabled";
  return "mock";
}

export function smileConfigured(): boolean {
  return Boolean(
    process.env.SMILE_IDENTITY_API_KEY?.trim() &&
      process.env.SMILE_IDENTITY_PARTNER_ID?.trim(),
  );
}

export type SmileSession = {
  status: "mock" | "pending";
  sessionId: string;
  redirectUrl?: string;
};

export async function createSmileSession(input: {
  userId: string;
  storeId: string;
  email: string;
}): Promise<SmileSession> {
  const mode = smileMode();

  if (mode === "disabled") {
    throw new Error("smile_disabled");
  }

  if (mode === "mock") {
    return {
      status: "mock",
      sessionId: `mock-${input.storeId}`,
    };
  }

  // Le compte Smile n'est pas encore branché dans cette version : on ne
  // fabrique pas d'endpoint. Le mode manuel reste disponible.
  throw new Error("smile_live_not_implemented");
}
