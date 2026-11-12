import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReplyForm } from "@/components/support/reply-form";
import { setTicketStatusAction } from "@/lib/support/actions";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  isTicketOverdue,
  slaText,
} from "@/lib/support/display";
import { getSupportTicket } from "@/lib/support/queries";
import { resolveLocale } from "@/i18n/config";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const ticket = await getSupportTicket(id);
  if (!ticket || ticket.store_id !== store.id) notFound();

  const date = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Africa/Abidjan",
    }).format(new Date(value));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={`/${locale}/app/support/tickets`}
        className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
      >
        ← Tous les tickets
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.75rem]">
            {ticket.subject}
          </h1>
          <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.625rem] font-medium text-subtle">
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>
        <p className="mt-1 text-[0.6875rem] text-subtle">
          {CATEGORY_LABELS[ticket.category]} · {PRIORITY_LABELS[ticket.priority]} ·{" "}
          {slaText(ticket)}
        </p>
        {isTicketOverdue(ticket) ? (
          <p className="mt-1 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
            L’échéance de première réponse est dépassée.
          </p>
        ) : null}
      </header>

      <ul className="mt-5 space-y-3">
        {ticket.messages.map((message) => (
          <li
            key={message.id}
            className={`rounded-2xl border p-4 ${
              message.author_role === "admin"
                ? "border-brand-500/25 bg-brand-500/[0.06]"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
                {message.author_role === "admin" ? "Équipe Pashove" : "Toi"}
              </p>
              <span className="text-[0.625rem] text-faint">
                {date(message.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-body">
              {message.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <ReplyForm ticketId={ticket.id} closed={ticket.status === "closed"} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ticket.status !== "resolved" && ticket.status !== "closed" ? (
          <form action={setTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="resolved" />
            <input type="hidden" name="locale" value={locale} />
            <input
              type="hidden"
              name="back"
              value={`/${locale}/app/support/tickets/${ticket.id}`}
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
            >
              Marquer comme résolu
            </button>
          </form>
        ) : null}
        {ticket.status !== "closed" ? (
          <form action={setTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="closed" />
            <input type="hidden" name="locale" value={locale} />
            <input
              type="hidden"
              name="back"
              value={`/${locale}/app/support/tickets/${ticket.id}`}
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-subtle hover:border-border-strong"
            >
              Fermer le ticket
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
