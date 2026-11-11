"use client";

import {
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  requestStudioVideo,
  sendStudioMessage,
  startStudioRechargeAction,
  type StudioActionResult,
  type StudioRechargeState,
} from "@/lib/studio/actions";

export type VideoOption = {
  actionType: string;
  label: string;
  description: string | null;
  priceFcfa: number;
  priceLabel: string;
};

type Props = {
  ready: boolean;
  locale: string;
  balanceLabel: string;
  chatPriceLabel: string;
  videoOptions: VideoOption[];
  networks: { code: string; name: string }[];
  pendingTopupLabel: string | null;
};

type ChatMessage = { role: "user" | "assistant"; text: string };

export function StudioWorkspace({
  ready,
  locale,
  balanceLabel,
  chatPriceLabel,
  videoOptions,
  networks,
  pendingTopupLabel,
}: Props) {
  const [tab, setTab] = useState<"chat" | "video">("chat");
  const [rechargeOpen, setRechargeOpen] = useState(false);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
              Solde Studio
            </p>
            <p className="mt-1 font-display text-[2rem] leading-none tracking-[-0.04em] text-fg">
              {balanceLabel}
            </p>
            <p className="mt-1.5 text-[0.75rem] text-subtle">
              Crédit de bienvenue de 500 FCFA offert à chaque boutique.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRechargeOpen((value) => !value)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-soft px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
          >
            <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />
            Recharger
          </button>
        </div>

        {rechargeOpen ? (
          <RechargePanel ready={ready} locale={locale} networks={networks} />
        ) : null}
      </section>

      {pendingTopupLabel ? (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/[0.06] px-4 py-3 text-[0.8125rem] leading-relaxed text-body">
          {pendingTopupLabel}
          <AutoRefresh intervalMs={5000} />
        </div>
      ) : null}

      {!ready ? (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-700 dark:text-amber-300">
          Le Studio n’est pas encore activé sur cette base. Applique la
          migration <code>20261111100000_studio.sql</code> puis recharge la
          page.
        </p>
      ) : null}

      <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
        <TabButton
          active={tab === "chat"}
          onClick={() => setTab("chat")}
          icon={icons.chat}
        >
          Chat & Textes
        </TabButton>
        <TabButton
          active={tab === "video"}
          onClick={() => setTab("video")}
          icon={icons.play}
        >
          Générateur Vidéo
        </TabButton>
      </div>

      {tab === "chat" ? (
        <ChatPanel ready={ready} priceLabel={chatPriceLabel} />
      ) : (
        <VideoPanel ready={ready} options={videoOptions} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[0.8125rem] font-medium transition-colors",
        active
          ? "bg-brand-500 text-white"
          : "text-subtle hover:bg-hairline hover:text-fg",
      )}
    >
      <Icon path={icon} className="h-4 w-4" strokeWidth={1.9} />
      {children}
    </button>
  );
}

function ResultNotice({ result }: { result: StudioActionResult | null }) {
  if (!result) return null;

  const tones = {
    ok: "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-700 dark:text-emerald-300",
    error: "border-red-500/30 bg-red-500/[0.06] text-red-600 dark:text-red-400",
    unavailable:
      "border-amber-400/30 bg-amber-400/[0.07] text-amber-700 dark:text-amber-300",
  };

  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2 text-[0.75rem] leading-relaxed",
        tones[result.status],
      )}
    >
      {result.message}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 *  Recharge
 * ------------------------------------------------------------------ */

function RechargePanel({
  ready,
  locale,
  networks,
}: {
  ready: boolean;
  locale: string;
  networks: { code: string; name: string }[];
}) {
  const [amount, setAmount] = useState("500");
  const [state, formAction, pending] = useActionState<
    StudioRechargeState,
    FormData
  >(startStudioRechargeAction, { status: "idle" });

  if (networks.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-700 dark:text-amber-300">
        Aucun réseau Mobile Money n’est disponible pour le pays de ta boutique.
        La recharge sera activée dès qu’un réseau sera disponible.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-5 rounded-2xl border border-border bg-bg-soft p-4"
    >
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            Montant à recharger
          </span>
          <div className="relative mt-1.5">
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              min={500}
              max={500000}
              step={50}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={!ready || pending}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 pe-14 text-[0.9375rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-60"
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[0.6875rem] text-faint">
              FCFA
            </span>
          </div>
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            Moyen de paiement
          </span>
          <select
            name="network"
            defaultValue={networks[0]?.code}
            disabled={!ready || pending}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg disabled:opacity-60"
          >
            {networks.map((network) => (
              <option key={network.code} value={network.code}>
                {network.name}
              </option>
            ))}
          </select>
        </label>

        <label className="sm:col-span-2">
          <span className="block text-[0.75rem] font-medium text-body">
            Numéro Mobile Money
          </span>
          <input
            name="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="+223 70 00 00 00"
            maxLength={40}
            disabled={!ready || pending}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[0.9375rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-60"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[500, 1000, 2000, 5000].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            disabled={!ready || pending}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-[0.75rem] font-medium text-subtle hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
          >
            {value.toLocaleString("fr-FR")} FCFA
          </button>
        ))}
      </div>

      <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">
        Minimum 500 FCFA. Les frais SasPay sont ajoutés au montant. Ton solde
        est crédité dès la confirmation du paiement.
      </p>

      {state.message ? (
        <p
          role="status"
          className={cn(
            "mt-3 rounded-xl border px-3 py-2 text-[0.75rem] leading-relaxed",
            state.status === "pending"
              ? "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/[0.06] text-red-600 dark:text-red-400",
          )}
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "pending" ? (
        <AutoRefresh intervalMs={5000} />
      ) : null}

      <button
        type="submit"
        disabled={!ready || pending}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white disabled:opacity-60"
      >
        {pending ? <Spinner /> : <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />}
        {pending ? "Ouverture…" : "Payer avec Mobile Money"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 *  Chat
 * ------------------------------------------------------------------ */

function ChatPanel({
  ready,
  priceLabel,
}: {
  ready: boolean;
  priceLabel: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "Bienvenue dans Pashove Studio. Décris ton produit ou ton idée : l’assistant te préparera un texte prêt à publier. Chaque message coûtera " +
        priceLabel +
        ".",
    },
  ]);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = value.trim();
    if (!prompt || pending || !ready) return;

    const history = messages
      .slice(-12)
      .map((message) => ({ role: message.role, content: message.text }));

    setValue("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setPending(true);
    const result = await sendStudioMessage(prompt, history);
    setPending(false);

    if (result.status === "ok") {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.message },
      ]);
      router.refresh();
    } else {
      setError(result.message);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-surface">
      <div className="max-h-[26rem] space-y-3 overflow-y-auto p-5 sm:p-6">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-[0.8125rem] leading-relaxed",
                message.role === "user"
                  ? "bg-brand-500 text-white"
                  : "bg-hairline text-body",
              )}
            >
              {message.role === "assistant" ? (
                <span className="mb-1 flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">
                  <Icon
                    path={icons.sparkle}
                    className="h-3 w-3"
                    strokeWidth={2}
                  />
                  Studio
                </span>
              ) : null}
              {message.text}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-hairline px-4 py-3 text-[0.75rem] text-subtle">
              <Spinner /> Le Studio prépare sa réponse…
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mx-5 mb-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400 sm:mx-6">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={submit}
        className="border-t border-border bg-bg-soft p-4 sm:p-5"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={2}
            maxLength={2000}
            disabled={!ready || pending}
            placeholder="Écris-moi une description pour mon sac en cuir…"
            className="min-h-[3.25rem] flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-[0.875rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!ready || pending || !value.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white disabled:opacity-50"
            aria-label="Envoyer"
          >
            {pending ? (
              <Spinner />
            ) : (
              <Icon path={icons.arrowUp} className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
        <p className="mt-2 text-[0.6875rem] text-faint">
          {priceLabel} par message, débités du solde Studio.
        </p>
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Vidéo
 * ------------------------------------------------------------------ */

function VideoPanel({
  ready,
  options,
}: {
  ready: boolean;
  options: VideoOption[];
}) {
  const [selected, setSelected] = useState(options[0]?.actionType ?? "");
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<StudioActionResult | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const router = useRouter();

  const option = options.find((entry) => entry.actionType === selected);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || pending || !option) return;

    setPending(true);
    setScript(null);
    const response = await requestStudioVideo({
      actionType: option.actionType,
      prompt,
    });
    setPending(false);
    setResult(response);

    if (response.status === "ok") {
      setScript(response.resultText ?? null);
      router.refresh();
    }
  }

  if (options.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 text-[0.8125rem] text-subtle">
        Les tarifs vidéo ne sont pas encore disponibles.
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Choisis ton format
        </h2>
        <p className="mt-1 text-[0.75rem] text-subtle">
          Plus le format est long et travaillé, plus le rendu est complet.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((entry) => {
          const active = entry.actionType === selected;
          return (
            <button
              key={entry.actionType}
              type="button"
              onClick={() => setSelected(entry.actionType)}
              disabled={!ready}
              className={cn(
                "rounded-2xl border p-4 text-left transition-colors disabled:opacity-60",
                active
                  ? "border-brand-500 bg-brand-500/[0.06]"
                  : "border-border bg-bg-soft hover:border-border-strong",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[0.8125rem] font-medium text-fg">
                  {entry.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                    active
                      ? "bg-brand-500 text-white"
                      : "bg-hairline text-subtle",
                  )}
                >
                  {entry.priceLabel}
                </span>
              </span>
              {entry.description ? (
                <span className="mt-1.5 block text-[0.75rem] leading-relaxed text-subtle">
                  {entry.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <label className="mt-5 block">
        <span className="block text-[0.75rem] font-medium text-body">
          Que doit montrer la vidéo ?
        </span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          maxLength={2000}
          disabled={!ready || pending}
          placeholder="Présente mon sac en cuir, ambiance atelier, musique douce…"
          className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-bg-soft px-4 py-3 text-[0.875rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-60"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-soft px-4 py-3">
        <p className="max-w-md text-[0.8125rem] leading-relaxed text-body">
          Cette vidéo coûte{" "}
          <span className="font-semibold text-fg">
            {option?.priceLabel ?? "—"}
          </span>{" "}
          — script inclus. Le rendu vidéo sera ajouté à l’étape suivante.
        </p>
        <button
          type="submit"
          disabled={!ready || pending || !option}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white disabled:opacity-60"
        >
          {pending ? <Spinner /> : <Icon path={icons.sparkle} className="h-4 w-4" strokeWidth={2} />}
          {pending ? "Préparation…" : "Générer"}
        </button>
      </div>

      {script ? (
        <div className="mt-3 rounded-2xl border border-border bg-bg-soft p-4">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">
            Script généré
          </p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[0.8125rem] leading-relaxed text-body">
            {script}
          </pre>
        </div>
      ) : null}

      {result ? (
        <div className="mt-3">
          <ResultNotice result={result} />
        </div>
      ) : null}
    </form>
  );
}
