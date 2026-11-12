import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  StudioWorkspace,
  type VideoOption,
} from "@/components/studio/studio-workspace";
import { resolveLocale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { isGatewayNetwork } from "@/lib/payments/catalog";
import { listPayinRates } from "@/lib/payments/saspay/client";
import { getStudioSnapshot } from "@/lib/studio/queries";
import type {
  StudioGeneration,
  StudioGenerationStatus,
} from "@/lib/studio/types";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Pashove Studio",
  robots: { index: false, follow: false },
};

const VIDEO_TYPES = new Set([
  "video_15s_simple",
  "video_30s_standard",
  "video_60s_premium",
  "video_110s_ultra",
]);

const STATUS_LABELS: Record<StudioGenerationStatus, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Terminée",
  failed: "Échouée",
};

const STATUS_CLASSES: Record<StudioGenerationStatus, string> = {
  pending: "bg-hairline text-subtle",
  processing: "bg-brand-500/10 text-brand-600 dark:text-brand-300",
  completed:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
}

function excerpt(value: string | null, max = 140): string | null {
  if (!value) return null;
  const clean = value.trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export default async function StudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [snapshot, rates] = await Promise.all([
    getStudioSnapshot(store.id),
    listPayinRates().catch(() => []),
  ]);
  const money = (amount: number) => formatMoney(amount, "XOF", "fr-FR");

  const networks = rates
    .filter(
      (rate) =>
        rate.country_code?.toUpperCase() === store.country.toUpperCase() &&
        rate.payin?.available !== false &&
        !isGatewayNetwork(rate.network_code),
    )
    .map((rate) => ({ code: rate.network_code, name: rate.network_name }));

  const videoOptions: VideoOption[] = snapshot.prices
    .filter((price) => VIDEO_TYPES.has(price.actionType))
    .map((price) => ({
      actionType: price.actionType,
      label: price.label,
      description: price.description,
      priceFcfa: price.priceFcfa,
      priceLabel: money(price.priceFcfa),
    }));

  const chatPrice =
    snapshot.prices.find((price) => price.actionType === "chat_message")
      ?.priceFcfa ?? 5;

  const labels = new Map(
    snapshot.prices.map((price) => [price.actionType, price.label]),
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Création
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.125rem]">
          Pashove Studio
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-subtle">
          Écris les textes de ta boutique et prépare tes vidéos publicitaires.
          Ton solde Studio est débité à chaque génération.
        </p>
      </header>

      <div className="mt-6">
        <StudioWorkspace
          ready={snapshot.ready}
          locale={locale}
          balanceLabel={money(snapshot.balance.balanceFcfa)}
          chatPriceLabel={money(chatPrice)}
          videoOptions={videoOptions}
          networks={networks}
          pendingTopupLabel={
            snapshot.pendingTopup
              ? `Recharge de ${money(snapshot.pendingTopup.amountFcfa)} en attente de confirmation. Ton solde se met à jour automatiquement.`
              : null
          }
        />
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Historique
          </h2>
          <span className="text-[0.6875rem] text-faint">
            {snapshot.generations.length}
          </span>
        </div>

        {snapshot.generations.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-subtle">
            Aucune création pour l’instant. Ton premier texte ou ta première
            vidéo apparaîtra ici, avec le prix payé.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {snapshot.generations.map((generation) => (
              <GenerationRow
                key={generation.id}
                generation={generation}
                label={
                  labels.get(generation.actionType) ?? generation.actionType
                }
                priceLabel={money(generation.pricePaidFcfa)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GenerationRow({
  generation,
  label,
  priceLabel,
}: {
  generation: StudioGeneration;
  label: string;
  priceLabel: string;
}) {
  const result = excerpt(generation.resultText);

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.8125rem] font-medium text-fg">{label}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.625rem] ${STATUS_CLASSES[generation.status]}`}
            >
              {STATUS_LABELS[generation.status]}
            </span>
          </div>
          <p className="mt-1 truncate text-[0.75rem] text-subtle">
            {excerpt(generation.prompt, 120) ?? "Sans consigne"}
          </p>
          {result ? (
            <p className="mt-1 line-clamp-2 text-[0.75rem] leading-relaxed text-body">
              {result}
            </p>
          ) : null}
          {generation.videoUrl ? (
            <a
              href={generation.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[0.75rem] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Voir la vidéo
            </a>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[0.8125rem] font-medium text-fg">{priceLabel}</p>
          <p className="mt-0.5 text-[0.625rem] text-faint">
            {formatDate(generation.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
