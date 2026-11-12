import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplyForm } from "@/components/support/reply-form";
import {
  assignToMeAction,
  setTicketStatusAction,
} from "@/lib/support/actions";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  isTicketOverdue,
  slaText,
} from "@/lib/support/display";
import {
  getSupportTicket,
  listSupportMacros,
} from "@/lib/support/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, macros] = await Promise.all([
    getSupportTicket(id),
    listSupportMacros(),
  ]);

  if (!ticket) notFound();

  const date = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Africa/Abidjan",
    }).format(new Date(value));

  const back = `/platform-admin/support/${ticket.id}`;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/platform-admin/support"
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
          {ticket.store_name ?? "Boutique"} · {CATEGORY_LABELS[ticket.category]} ·{" "}
          {PRIORITY_LABELS[ticket.priority]} · {slaText(ticket)}
        </p>
        {isTicketOverdue(ticket) ? (
          <p className="mt-1 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
            SLA dépassé — première réponse attendue.
          </p>
        ) : null}
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form action={setTicketStatusAction} className="flex items-center gap-1.5">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <input type="hidden" name="back" value={back} />
          <select
            name="status"
            defaultValue={ticket.status}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-[0.75rem] text-fg"
          >
            <option value="open">Ouvert</option>
            <option value="pending">En attente marchand</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[0.75rem] font-medium text-body hover:border-border-strong"
          >
            Changer le statut
          </button>
        </form>

        <form action={assignToMeAction}>
          <input type="hidden" name="ticketId" value={ticket.id} />
          <input type="hidden" name="back" value={back} />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-[0.75rem] font-medium text-body hover:border-border-strong"
          >
            M’assigner
          </button>
        </form>
      </div>

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
                {message.author_role === "admin"
                  ? "Pashove"
                  : ticket.store_name ?? "Marchand"}
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
        <ReplyForm
          ticketId={ticket.id}
          closed={false}
          macros={macros}
        />
      </div>
    </div>
  );
}
