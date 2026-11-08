/**
 * Client de l'API Vercel pour les domaines personnalisés.
 *
 * Le jeton Vercel ne quitte jamais le serveur. Les endpoints sont ceux de
 * l'API publique :
 *   POST   /v10/projects/{idOrName}/domains
 *   GET    /v9/projects/{idOrName}/domains/{domain}
 *   POST   /v9/projects/{idOrName}/domains/{domain}/verify
 *   DELETE /v9/projects/{idOrName}/domains/{domain}
 *   GET    /v6/domains/{domain}/config
 */

export type VercelVerification = {
  type: string;
  domain: string;
  value: string;
  reason: string;
};

export type VercelProjectDomain = {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: VercelVerification[];
};

export type VercelDomainConfig = {
  misconfigured: boolean;
  configuredBy: string | null;
  recommendedIPv4: { rank: number; value: string[] }[];
  recommendedCNAME: { rank: number; value: string }[];
};

export type VercelResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

function projectId(): string | null {
  return (
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_PROJECT_NAME?.trim() ||
    null
  );
}

function token(): string | null {
  return (
    process.env.VERCEL_API_TOKEN?.trim() ||
    process.env.VERCEL_ACCESS_TOKEN?.trim() ||
    null
  );
}

export function isDomainsConfigured(): boolean {
  return Boolean(projectId() && token());
}

function codeFor(status: number, message: string): string {
  if (status === 401) return "token_invalid";
  if (status === 402) return "payment_required";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "domain_taken";
  if (status === 400) {
    if (/already exist/i.test(message)) return "domain_exists";
    if (/not valid|invalid/i.test(message)) return "invalid_domain";
    return "invalid_request";
  }
  return "vercel_error";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<VercelResult<T>> {
  const accessToken = token();
  const project = projectId();

  if (!accessToken || !project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Vercel n'est pas configuré pour les domaines personnalisés.",
    };
  }

  const url = new URL(`https://api.vercel.com${path}`);
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (teamId) url.searchParams.set("teamId", teamId);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    return {
      ok: false,
      status: 502,
      code: "network_error",
      message: "L'API Vercel est injoignable.",
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    const error = payload?.error as { message?: string } | undefined;
    const message =
      error?.message ??
      (typeof payload?.message === "string" ? payload.message : "") ??
      "";

    return {
      ok: false,
      status: response.status,
      code: codeFor(response.status, message),
      message: message || "Vercel a refusé la requête.",
    };
  }

  return { ok: true, data: payload as T };
}

/** Ajoute le domaine au projet. Un domaine déjà présent est récupéré. */
export async function addProjectDomain(
  domain: string,
): Promise<VercelResult<VercelProjectDomain>> {
  const project = projectId();
  if (!project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Projet Vercel non configuré.",
    };
  }

  const added = await request<VercelProjectDomain>(
    `/v10/projects/${encodeURIComponent(project)}/domains`,
    { method: "POST", body: JSON.stringify({ name: domain }) },
  );

  if (added.ok) return added;

  // Vercel renvoie 400 si le domaine est déjà rattaché au projet.
  if (added.status === 400) {
    const existing = await getProjectDomain(domain);
    if (existing.ok) return existing;
  }

  return added;
}

export async function getProjectDomain(
  domain: string,
): Promise<VercelResult<VercelProjectDomain>> {
  const project = projectId();
  if (!project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Projet Vercel non configuré.",
    };
  }

  return request<VercelProjectDomain>(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`,
  );
}

/** Demande à Vercel de vérifier le challenge TXT du domaine. */
export async function verifyProjectDomain(
  domain: string,
): Promise<VercelResult<unknown>> {
  const project = projectId();
  if (!project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Projet Vercel non configuré.",
    };
  }

  return request<unknown>(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}/verify`,
    { method: "POST" },
  );
}

/** Retire le domaine du projet. Un domaine déjà absent est un succès. */
export async function removeProjectDomain(
  domain: string,
): Promise<VercelResult<null>> {
  const project = projectId();
  if (!project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Projet Vercel non configuré.",
    };
  }

  const removed = await request<null>(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`,
    { method: "DELETE" },
  );

  if (!removed.ok && removed.code === "not_found") {
    return { ok: true, data: null };
  }

  return removed;
}

/** Enregistrements DNS recommandés et état de la configuration. */
export async function getDomainConfig(
  domain: string,
): Promise<VercelResult<VercelDomainConfig>> {
  const project = projectId();
  if (!project) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Projet Vercel non configuré.",
    };
  }

  const url = new URL(
    `https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config`,
  );
  url.searchParams.set("projectIdOrName", project);

  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (teamId) url.searchParams.set("teamId", teamId);

  const accessToken = token();
  if (!accessToken) {
    return {
      ok: false,
      status: 503,
      code: "not_configured",
      message: "Jeton Vercel non configuré.",
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = (await response.json().catch(() => null)) as
      | VercelDomainConfig
      | null;

    if (!response.ok || !payload) {
      return {
        ok: false,
        status: response.status,
        code: codeFor(response.status, ""),
        message: "Configuration DNS indisponible.",
      };
    }

    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      status: 502,
      code: "network_error",
      message: "Configuration DNS indisponible.",
    };
  }
}
