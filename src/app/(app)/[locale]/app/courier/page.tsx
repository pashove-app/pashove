import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getMyCourierProfile } from "@/lib/couriers/queries";
import { myCourierDeliveries } from "@/lib/delivery/courier-queries";
import {
  acceptDeliveryAction,
  declineDeliveryAction,
  deliverDeliveryAction,
  reportDeliveryProblemAction,
  setCourierOnlineAction,
} from "@/lib/delivery/courier-actions";
import { OfferCountdown } from "@/components/couriers/offer-countdown";
import { CourierRefresh } from "@/components/couriers/courier-refresh";
import { SoundAlert } from "@/components/ui/sound-alert";
import { LOCALE_META } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
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
    onlineTitle: "Disponibilité",
    onlineText: "Tu ne reçois des courses que lorsque tu es en ligne.",
    goOnline: "Passer en ligne",
    goOffline: "Passer hors ligne",
    offerTitle: "Nouvelle course",
    timeLeft: "Temps restant",
    accept: "Accepter",
    decline: "Refuser",
    pickup: "Ramassage",
    dropoff: "Livraison",
    courseFee: "Course",
    orderLabel: "Commande",
    activeTitle: "Course en cours",
    activeText: "Récupère le colis chez le marchand puis livre le client.",
    deliveredBanner: "Course terminée. Le paiement de la livraison est libéré.",
    disputedBanner:
      "Problème signalé. Le paiement reste bloqué jusqu’à la décision de Pashove.",
    otpTitle: "Code de livraison",
    otpText: "Demande les 4 chiffres au client et saisis-les à la réception.",
    otpPlaceholder: "1234",
    validate: "Valider la livraison",
    disputeTitle: "Signaler un problème",
    disputePlaceholder: "Client absent, adresse introuvable…",
    report: "Signaler",
    errors: {
      invalidOtp: "Code incorrect. Vérifie avec le client.",
      otpLocked: "Trop de tentatives. Contacte le support Pashove.",
      otpExpired: "Le code a expiré. Contacte le support Pashove.",
      problemFailed: "Signalement impossible pour le moment.",
    },
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
    onlineTitle: "Availability",
    onlineText: "You only receive rides while online.",
    goOnline: "Go online",
    goOffline: "Go offline",
    offerTitle: "New ride",
    timeLeft: "Time left",
    accept: "Accept",
    decline: "Decline",
    pickup: "Pickup",
    dropoff: "Drop-off",
    courseFee: "Ride",
    orderLabel: "Order",
    activeTitle: "Ride in progress",
    activeText: "Pick up the parcel from the store, then deliver to the customer.",
    deliveredBanner: "Ride complete. The delivery payment is released.",
    disputedBanner:
      "Problem reported. Payment stays locked until Pashove decides.",
    otpTitle: "Delivery code",
    otpText: "Ask the customer for the 4 digits and enter them on delivery.",
    otpPlaceholder: "1234",
    validate: "Validate delivery",
    disputeTitle: "Report a problem",
    disputePlaceholder: "Customer absent, address not found…",
    report: "Report",
    errors: {
      invalidOtp: "Wrong code. Check with the customer.",
      otpLocked: "Too many attempts. Contact Pashove support.",
      otpExpired: "The code has expired. Contact Pashove support.",
      problemFailed: "Could not report the problem.",
    },
  },
};

export default async function CourierDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    submitted?: string;
    error?: string;
    delivered?: string;
    disputed?: string;
  }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { submitted, error, delivered, disputed } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const courier = await getMyCourierProfile();
  const deliveries =
    courier?.status === "approved"
      ? await myCourierDeliveries()
      : { offer: null, active: null };

  const tag = LOCALE_META[locale].tag;
  const money = (amount: number, currency: string) =>
    formatMoney(amount, currency, tag);

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

      {delivered ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          <Icon path={icons.check} className="mt-0.5 h-4 w-4" strokeWidth={2.4} />
          {copy.deliveredBanner}
        </p>
      ) : null}

      {disputed ? (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-3.5 py-3 text-[0.8125rem] text-amber-700 dark:text-amber-300">
          {copy.disputedBanner}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          {(copy.errors as Record<string, string>)[error] ??
            decodeURIComponent(error)}
        </p>
      ) : null}

      {courier?.status === "approved" ? (
        <>
          {courier.isOnline ? <CourierRefresh /> : null}
          <SoundAlert triggerKey={deliveries.offer?.id ?? ""} />

          <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  {copy.onlineTitle}
                </p>
                <p className="mt-1 text-[0.875rem] text-subtle">
                  {copy.onlineText}
                </p>
              </div>
              <form action={setCourierOnlineAction}>
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="hidden"
                  name="online"
                  value={courier.isOnline ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[0.8125rem] font-semibold text-white transition-colors ${
                    courier.isOnline
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-brand-500 hover:bg-brand-600"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                  {courier.isOnline ? copy.goOffline : copy.goOnline}
                </button>
              </form>
            </div>
          </section>

          {deliveries.offer ? (
            <section className="mt-4 rounded-3xl border-2 border-brand-500 bg-brand-500/[0.06] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
                  {copy.offerTitle}
                </p>
                {deliveries.offer.offerExpiresAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-[0.75rem] font-semibold text-white">
                    {copy.timeLeft}
                    <OfferCountdown
                      deliveryId={deliveries.offer.id}
                      expiresAt={deliveries.offer.offerExpiresAt}
                    />
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[1.0625rem] font-medium text-fg">
                {copy.orderLabel} #{deliveries.offer.orderNumber} ·{" "}
                {deliveries.offer.storeName}
              </p>

              <dl className="mt-4 space-y-2 text-[0.8125rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.pickup}</dt>
                  <dd className="text-end font-medium text-fg">
                    {deliveries.offer.storeName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.dropoff}</dt>
                  <dd className="text-end font-medium text-fg">
                    {deliveries.offer.shippingAddress}
                    {deliveries.offer.shippingExtra
                      ? `, ${deliveries.offer.shippingExtra}`
                      : ""}
                    , {deliveries.offer.shippingCity}{" "}
                    ({deliveries.offer.shippingCountry})
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.courseFee}</dt>
                  <dd className="text-end font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {money(deliveries.offer.feeAmount, deliveries.offer.currency)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <form action={acceptDeliveryAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="deliveryId" value={deliveries.offer.id} />
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center rounded-full bg-emerald-600 text-[0.875rem] font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    {copy.accept}
                  </button>
                </form>
                <form action={declineDeliveryAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="deliveryId" value={deliveries.offer.id} />
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center rounded-full border border-border text-[0.875rem] font-medium text-body transition-colors hover:border-border-strong"
                  >
                    {copy.decline}
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          {deliveries.active ? (
            <section className="mt-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.05] p-5 sm:p-6">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                {copy.activeTitle}
              </p>
              <p className="mt-2 text-[1.0625rem] font-medium text-fg">
                {copy.orderLabel} #{deliveries.active.orderNumber} ·{" "}
                {deliveries.active.storeName}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {copy.activeText}
              </p>
              <dl className="mt-4 space-y-2 text-[0.8125rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.dropoff}</dt>
                  <dd className="text-end font-medium text-fg">
                    {deliveries.active.shippingAddress}
                    {deliveries.active.shippingExtra
                      ? `, ${deliveries.active.shippingExtra}`
                      : ""}
                    , {deliveries.active.shippingCity}{" "}
                    ({deliveries.active.shippingCountry})
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.courseFee}</dt>
                  <dd className="text-end font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {money(deliveries.active.feeAmount, deliveries.active.currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{copy.orderLabel}</dt>
                  <dd className="text-end text-fg">
                    {deliveries.active.customerName} ·{" "}
                    {deliveries.active.customerPhone}
                  </dd>
                </div>
              </dl>

              <form
                action={deliverDeliveryAction}
                className="mt-5 flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="deliveryId" value={deliveries.active.id} />
                <input
                  name="otp"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder={copy.otpPlaceholder}
                  className="h-11 flex-1 rounded-full border border-border bg-bg px-4 text-center text-[1rem] font-semibold tracking-[0.3em] text-fg outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  {copy.validate}
                </button>
              </form>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-subtle">
                {copy.otpText}
              </p>

              <form
                action={reportDeliveryProblemAction}
                className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="deliveryId" value={deliveries.active.id} />
                <input
                  name="reason"
                  required
                  maxLength={300}
                  placeholder={copy.disputePlaceholder}
                  className="h-10 min-w-[12rem] flex-1 rounded-full border border-border bg-bg px-4 text-[0.75rem] text-fg outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-red-500/30 px-4 text-[0.75rem] font-medium text-red-600 transition-colors hover:bg-red-500/[0.06] dark:text-red-400"
                >
                  {copy.report}
                </button>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
