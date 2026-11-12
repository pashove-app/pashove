import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketForm } from "@/components/support/ticket-form";
import { resolveLocale } from "@/i18n/config";
import { listSupportTickets } from "@/lib/support/queries";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, isTicketOverdue, slaText } from "@/lib/support/display";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Tickets support",
  robots: { index: false, follow: false },
};

export default async function SupportTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const tickets = await listSupportTickets({ storeId: store.id });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Support
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Tickets
        </h1>
        <p className="mt-1 text-[0.8125rem] text-subtle">
          Suis tes demandes et retrouve les réponses de l’équipe.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/app/support/kb`}
            className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
          >
            Base de connaissances
          </Link>
          <Link
            href={`/${locale}/app/support`}
            className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
          >
            Messagerie
          </Link>
        </div>
      </header>

      <div className="mt-5">
        <TicketForm locale={locale} />
      </div>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">Mes tickets</h2>
        </div>

        {tickets.length === 0 ? (
          <p className="px-6 py-10 text-center text-[0.8125rem] text-subtle">
            Aucun ticket pour l’instant.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/${locale}/app/support/tickets/${ticket.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-hairline/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.875rem] font-medium text-fg">
                      {ticket.subject}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.625rem] font-medium ${
                        ticket.status === "open"
                          ? "bg-brand-500/10 text-accent"
                          : ticket.status === "pending"
                            ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.6875rem] text-subtle">
                    {CATEGORY_LABELS[ticket.category]} ·{" "}
                    {PRIORITY_LABELS[ticket.priority]} · {ticket.message_count}{" "}
                    message{ticket.message_count === 1 ? "" : "s"} ·{" "}
                    {slaText(ticket)}
                  </p>
                  {isTicketOverdue(ticket) ? (
                    <p className="mt-1 text-[0.6875rem] font-medium text-red-500 dark:text-red-400">
                      Échéance dépassée
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
