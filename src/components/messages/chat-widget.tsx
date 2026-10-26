"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import {
  loadMessagesAction,
  openCustomerChatAction,
  openSupportChatAction,
  sendMessageAction,
} from "@/lib/messages/actions";
import type {
  ChatMessage,
  ChatRole,
  ChatSession,
} from "@/lib/messages/types";

type Labels = Dictionary["messages"];

function roleLabel(role: ChatRole, labels: Labels): string {
  if (role === "customer") return labels.customer;
  if (role === "platform") return labels.platform;
  return labels.merchant;
}

function timeOf(value: string, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Fil de discussion partagé par la vitrine, le dashboard et l'administration. */
export function ChatThread({
  session,
  role,
  labels,
  localeTag,
  className,
  compact = false,
}: {
  session: ChatSession;
  role: ChatRole;
  labels: Labels;
  localeTag: string;
  className?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const next = await loadMessagesAction(session.id);
      if (active) setMessages(next);
    };

    void load();
    const timer = setInterval(load, 6000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = value.trim();
    if (!body || pending) return;

    setError(false);
    startTransition(async () => {
      const result = await sendMessageAction({
        conversationId: session.id,
        body,
        role,
      });

      if (!result.ok || !result.message) {
        setError(true);
        return;
      }

      setMessages((current) => [...current, result.message!]);
      setValue("");
    });
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-[0.8125rem] text-subtle">
            {labels.noMessages}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                  message.mine
                    ? "rounded-br-md bg-brand-500 text-white"
                    : "rounded-bl-md border border-border bg-surface text-body",
                )}
              >
                {!message.mine ? (
                  <p className="mb-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] opacity-60">
                    {roleLabel(message.senderRole, labels)}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed">
                  {message.body}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[0.5625rem] tabular-nums",
                    message.mine ? "text-white/70" : "text-faint",
                  )}
                >
                  {timeOf(message.createdAt, localeTag)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={send}
        className={cn(
          "flex items-end gap-2 border-t border-border p-3",
          compact && "p-2.5",
        )}
      >
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-[0.8125rem] leading-relaxed text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />
        <button
          type="submit"
          disabled={pending || !value.trim()}
          aria-label={labels.send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Spinner /> : <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}
        </button>
      </form>

      {error ? (
        <p role="alert" className="px-4 pb-2 text-[0.6875rem] text-red-500 dark:text-red-400">
          {labels.error}
        </p>
      ) : null}
    </div>
  );
}

/** Bulle de discussion marchand ↔ client, présente sur toute la vitrine. */
export function StorefrontChat({
  slug,
  locale,
  labels,
  localeTag,
}: {
  slug: string;
  locale: Locale;
  labels: Labels;
  localeTag: string;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setOpen(true);
    if (session || loading) return;

    setLoading(true);
    const next = await openCustomerChatAction(slug);
    setSession(next);
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        aria-label={labels.openChat}
        title={labels.openChat}
        className="fixed bottom-5 end-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_18px_40px_-12px_rgba(37,99,235,0.65)] transition-transform hover:scale-105 active:scale-95"
      >
        <Icon path={icons.chat} className="h-6 w-6" strokeWidth={1.8} />
      </button>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-[75] flex h-[min(32rem,85dvh)] flex-col border-t border-border bg-bg shadow-2xl sm:inset-x-auto sm:bottom-24 sm:end-5 sm:w-[23rem] sm:rounded-3xl sm:border">
          <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
            <div>
              <p className="text-[0.9375rem] font-medium text-fg">{labels.chatTitle}</p>
              <p className="mt-0.5 text-[0.6875rem] text-subtle">{labels.chatSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.closeChat}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
            >
              <Icon path={icons.close} className="h-4 w-4" strokeWidth={2} />
            </button>
          </header>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : session?.authRequired ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-accent">
                <Icon path={icons.user} className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <p className="mt-4 text-[0.875rem] leading-relaxed text-muted">
                {labels.loginRequired}
              </p>
              <Link
                href={path(locale, `/store/${slug}/account/login`)}
                className="mt-4 inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white"
              >
                {labels.loginCta}
              </Link>
            </div>
          ) : session ? (
            <ChatThread
              session={session}
              role="customer"
              labels={labels}
              localeTag={localeTag}
              className="min-h-0 flex-1"
              compact
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[0.8125rem] text-subtle">{labels.loading}</p>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

/** Boîte de réception marchande ou plateforme. */
export function MessagesWorkspace({
  conversations,
  scope,
  storeId,
  labels,
  localeTag,
}: {
  conversations: {
    id: string;
    kind: "support" | "customer";
    storeId: string;
    storeName: string;
    customerName: string | null;
    customerEmail: string | null;
    lastMessage: string | null;
    lastAt: string;
  }[];
  scope: "merchant" | "platform";
  storeId?: string;
  labels: Labels;
  localeTag: string;
}) {
  const [items, setItems] = useState(conversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function contactSupport() {
    if (!storeId || creating) return;
    setCreating(true);
    const session = await openSupportChatAction(storeId);
    setCreating(false);
    if (!session) return;

    setItems((current) => {
      if (current.some((item) => item.id === session.id)) return current;
      return [
        {
          id: session.id,
          kind: "support",
          storeId: session.storeId,
          storeName: session.storeName,
          customerName: null,
          customerEmail: null,
          lastMessage: null,
          lastAt: new Date().toISOString(),
        },
        ...current,
      ];
    });
    setSelectedId(session.id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-subtle">{labels.subtitle}</p>
        </div>

        {scope === "merchant" && storeId ? (
          <button
            type="button"
            onClick={() => void contactSupport()}
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {creating ? <Spinner /> : <Icon path={icons.chat} className="h-4 w-4" strokeWidth={1.8} />}
            {labels.startSupport}
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-w-0 overflow-hidden rounded-3xl border border-border bg-surface",
            selected && "hidden lg:block",
          )}
        >
          <ul className="divide-y divide-hairline">
            {items.length === 0 ? (
              <li className="px-5 py-10 text-center">
                <p className="text-[0.875rem] font-medium text-fg">{labels.empty}</p>
                <p className="mt-1 text-[0.75rem] text-subtle">{labels.emptyText}</p>
              </li>
            ) : (
              items.map((conversation) => {
                const active = conversation.id === selectedId;
                const title =
                  conversation.kind === "support"
                    ? labels.support
                    : conversation.customerName ??
                      conversation.customerEmail ??
                      labels.customer;

                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors",
                        active ? "bg-brand-500/[0.08]" : "hover:bg-hairline/60",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          conversation.kind === "support"
                            ? "bg-brand-500 text-white"
                            : "bg-brand-500/10 text-accent",
                        )}
                      >
                        <Icon
                          path={conversation.kind === "support" ? icons.chat : icons.user}
                          className="h-4 w-4"
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[0.8125rem] font-medium text-fg">
                            {title}
                          </span>
                          <span className="shrink-0 text-[0.625rem] text-faint">
                            {timeOf(conversation.lastAt, localeTag)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[0.6875rem] text-subtle">
                          {conversation.lastMessage ?? labels.noMessages}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section
          className={cn(
            "flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface",
            !selected && "hidden lg:flex",
          )}
        >
          {selected ? (
            <>
              <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label={labels.title}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg lg:hidden"
                >
                  <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-medium text-fg">
                    {selected.kind === "support"
                      ? labels.support
                      : selected.customerName ??
                        selected.customerEmail ??
                        labels.customer}
                  </p>
                  <p className="truncate text-[0.6875rem] text-subtle">
                    {selected.kind === "support"
                      ? selected.storeName
                      : selected.storeName}
                  </p>
                </div>
              </header>
              <ChatThread
                session={{
                  id: selected.id,
                  kind: selected.kind,
                  storeId: selected.storeId,
                  storeName: selected.storeName,
                  customerName: selected.customerName,
                }}
                role={scope === "platform" ? "platform" : "merchant"}
                labels={labels}
                localeTag={localeTag}
                className="min-h-0 flex-1"
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-[0.8125rem] text-subtle">{labels.selectConversation}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
