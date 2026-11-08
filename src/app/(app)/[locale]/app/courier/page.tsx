import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getMyCourierProfile } from "@/lib/couriers/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: `${t.dashboard.nav.home} · Livreur` };
}

const COPY = {
  fr: {
    title: "Espace livreur",
    subtitle: "Ton dossier Pashove Delivery.",
    welcome: "Bienvenue",
    noProfile: "Tu n’as pas encore de dossier livreur.",
    noProfileText: "Dépose ta candidature : pièce d’identité et selfie.",
    apply: "Devenir livreur",
    pendingTitle: "Dossier en cours de vérification",
    pendingText:
      "L’équipe Pashove vérifie ta pièce et ton selfie. Tu recevras une réponse ici.",
    approvedTitle: "Compte livreur validé",
    approvedText:
      "Ton compte est actif. Les courses, le dispatch et le solde arrivent au lot L2.",
    rejectedTitle: "Dossier refusé",
    reapply: "Déposer un nouveau dossier",
    submitted: "Dossier envoyé. Il est en attente de vérification.",
    status: "Statut",
    pending: "En attente",
    approved: "Validé",
    rejected: "Refusé",
  },
  en: {
    title: "Courier space",
    subtitle: "Your Pashove Delivery application.",
    welcome: "Welcome",
    noProfile: "You do not have a courier application yet.",
    noProfileText: "Apply with your ID document and a selfie.",
    apply: "Become a courier",
    pendingTitle: "Application under review",
    pendingText:
      "The Pashove team is checking your ID and selfie. You will see the answer here.",
    approvedTitle: "Courier account approved",
    approvedText:
      "Your account is active. Rides, dispatch and balance arrive in lot L2.",
    rejectedTitle: "Application rejected",
    reapply: "Submit a new application",
    submitted: "Application sent. It is awaiting review.",
    status: "Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
};

export default async function CourierDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { submitted } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const courier = await getMyCourierProfile();

  const statusLabel = courier
    ? courier.status === "approved"
      ? copy.approved
      : courier.status === "rejected"
        ? copy.rejected
        : copy.pending
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app")} label={t.settings.backToApp} />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{copy.subtitle}</p>

      {submitted ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          <Icon path={icons.check} className="mt-0.5 h-4 w-4" strokeWidth={2.4} />
          {copy.submitted}
        </p>
      ) : null}

      <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
        {!courier ? (
          <>
            <p className="text-[0.9375rem] font-medium text-fg">
              {copy.noProfile}
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.noProfileText}
            </p>
            <Link
              href={path(locale, "/devenir-livreur#inscription")}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {copy.apply}
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  {copy.status}
                </p>
                <p className="mt-1 text-[1.125rem] font-medium text-fg">
                  {statusLabel}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
                  courier.status === "approved"
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                    : courier.status === "rejected"
                      ? "bg-red-500/12 text-red-600 dark:text-red-400"
                      : "bg-amber-400/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                {copy.welcome}, {courier.fullName.split(" ")[0]}
              </span>
            </div>

            <h2 className="mt-5 text-[1.0625rem] font-medium text-fg">
              {courier.status === "approved"
                ? copy.approvedTitle
                : courier.status === "rejected"
                  ? copy.rejectedTitle
                  : copy.pendingTitle}
            </h2>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
              {courier.status === "approved"
                ? copy.approvedText
                : courier.status === "rejected"
                  ? courier.rejectionReason ?? copy.rejectedTitle
                  : copy.pendingText}
            </p>

            {courier.status === "rejected" ? (
              <Link
                href={path(locale, "/devenir-livreur#inscription")}
                className="mt-4 inline-flex h-10 items-center rounded-full border border-border px-5 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
              >
                {copy.reapply}
              </Link>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
