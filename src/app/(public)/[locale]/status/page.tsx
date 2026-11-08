import type { Metadata } from "next";
import { Icon, icons } from "@/components/ui/primitives";
import { MarketingContainer, Eyebrow } from "@/components/marketing/ui";
import { MarketingReveal } from "@/components/marketing/animations";
import { resolveLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    eyebrow: "Statut",
    title: "État de la plateforme.",
    description:
      "L’état des services Pashove au moment où tu ouvres cette page. Les incidents seront publiés ici.",
    allGood: "Tous les services sont opérationnels.",
    checked: "Dernière vérification",
    servicesTitle: "Services",
    incidentsTitle: "Incidents récents",
    incidentsEmpty: "Aucun incident signalé.",
    note:
      "Cette page reflète l’état au chargement. Elle ne publie pas de pourcentage de disponibilité inventé.",
    services: [
      { name: "Site public", detail: "pashove.com, pages marketing et légales", status: "ok" },
      { name: "Espace marchand", detail: "dashboard, catalogue, commandes", status: "ok" },
      { name: "Checkout et Mobile Money", detail: "SasPay, 22 pays et 64 réseaux", status: "ok" },
      { name: "E-mails transactionnels", detail: "confirmation, commandes, sécurité", status: "ok" },
      { name: "Médias et fichiers", detail: "Cloudflare R2, liens signés", status: "ok" },
      { name: "Pashove Delivery", detail: "réseau de livreurs moto", status: "soon" },
    ],
    ok: "Opérationnel",
    soon: "Bientôt",
  },
  en: {
    eyebrow: "Status",
    title: "Platform status.",
    description:
      "The state of Pashove services when you open this page. Incidents will be published here.",
    allGood: "All services are operational.",
    checked: "Last check",
    servicesTitle: "Services",
    incidentsTitle: "Recent incidents",
    incidentsEmpty: "No incidents reported.",
    note:
      "This page reflects the state at load time. It does not publish invented uptime percentages.",
    services: [
      { name: "Public website", detail: "pashove.com, marketing and legal pages", status: "ok" },
      { name: "Merchant dashboard", detail: "dashboard, catalog, orders", status: "ok" },
      { name: "Checkout and mobile money", detail: "SasPay, 22 countries and 64 networks", status: "ok" },
      { name: "Transactional email", detail: "confirmation, orders, security", status: "ok" },
      { name: "Media and files", detail: "Cloudflare R2, signed links", status: "ok" },
      { name: "Pashove Delivery", detail: "moto courier network", status: "soon" },
    ],
    ok: "Operational",
    soon: "Soon",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/${locale}/status` },
  };
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;

  const checked = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <section className="bg-[#FAFAFA] py-14 sm:py-20">
      <MarketingContainer>
        <MarketingReveal>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="font-display mt-6 max-w-3xl text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02] tracking-[-0.045em] text-[#0A0E1A]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-[#5B6475]">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <p className="text-[0.9375rem] font-semibold text-emerald-900">
              {copy.allGood}
            </p>
            <p className="text-[0.75rem] text-emerald-800/70">
              {copy.checked} · {checked}
            </p>
          </div>
        </MarketingReveal>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[#8A93A5]">
              {copy.servicesTitle}
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {copy.services.map((service) => (
              <li
                key={service.name}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-[0.875rem] font-medium text-[#0A0E1A]">
                    {service.name}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-[#7B8496]">
                    {service.detail}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
                    service.status === "ok"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      service.status === "ok" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {service.status === "ok" ? copy.ok : copy.soon}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#8A93A5]">
            {copy.incidentsTitle}
          </p>
          <p className="mt-2 text-[0.8125rem] text-[#5B6475]">
            {copy.incidentsEmpty}
          </p>
        </div>

        <p className="mt-4 text-[0.6875rem] leading-relaxed text-[#8A93A5]">
          {copy.note}
        </p>
      </MarketingContainer>
    </section>
  );
}
