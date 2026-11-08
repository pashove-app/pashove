import { headers } from "next/headers";

/**
 * Vrai quand la requête arrive par un domaine marqué (sous-domaine Pashove ou
 * domaine personnalisé). Le proxy pose cet en-tête après résolution.
 */
export async function isBrandedRequest(): Promise<boolean> {
  return (await headers()).get("x-pashove-branded") === "1";
}
