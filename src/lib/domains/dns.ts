import type {
  VercelDomainConfig,
  VercelResult,
} from "@/lib/domains/vercel";

export type DnsRecommendations = {
  ipv4: string[];
  cname: string[];
};

/** Enregistrements recommandés, triés par priorité Vercel. */
export function dnsFromConfig(
  config: VercelResult<VercelDomainConfig>,
): DnsRecommendations | null {
  if (!config.ok) return null;

  const ipv4 = [...config.data.recommendedIPv4]
    .sort((a, b) => a.rank - b.rank)
    .flatMap((entry) => entry.value)
    .filter(Boolean)
    .slice(0, 2);

  const cname = [...config.data.recommendedCNAME]
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.value)
    .filter(Boolean)
    .slice(0, 2);

  return ipv4.length > 0 || cname.length > 0 ? { ipv4, cname } : null;
}

/**
 * Le domaine ne devient actif qu'une fois la propriété vérifiée **et** le DNS
 * correctement pointé : sans cela, le proxy ne doit pas le résoudre.
 */
export function statusFrom(
  verified: boolean,
  config: VercelResult<VercelDomainConfig>,
): "pending" | "verified" {
  if (!verified) return "pending";
  if (!config.ok) return "pending";
  return config.data.misconfigured ? "pending" : "verified";
}
