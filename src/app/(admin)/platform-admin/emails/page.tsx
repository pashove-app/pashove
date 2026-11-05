import Link from "next/link";
import { emailCounts, listEmailMessages } from "@/lib/email/queries";
import type { EmailMessageStatus } from "@/lib/email/queries";

export const metadata = {
  title: "Pashove · E-mails",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<EmailMessageStatus, string> = {
  sent: "Envoyé",
  failed: "Échec",
  queued: "En file",
  skipped: "Ignoré",
};

const STATUS_CLASS: Record<EmailMessageStatus, string> = {
  sent: "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
  failed: "border-red-400/30 bg-red-400/10 text-red-600 dark:text-red-400",
  queued: "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400",
  skipped: "border-border bg-hairline text-subtle",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "sent", label: "Envoyés" },
  { value: "failed", label: "Échecs" },
  { value: "queued", label: "En file" },
];

function isStatus(value?: string): value is EmailMessageStatus {
  return value === "sent" || value === "failed" || value === "queued" || value === "skipped";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [messages, counts] = await Promise.all([
    listEmailMessages(80, filter),
    emailCounts(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Pashove · interne
          </p>
          <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.04em] text-fg">
            E-mails
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-subtle">
            Chaque envoi laisse une trace : destinataire, gabarit, statut et
            erreur éventuelle. Les échecs repartent automatiquement en file.
          </p>
        </div>

        <div className="flex gap-2">
          <Stat label="Envoyés" value={counts.sent} />
          <Stat label="Échecs" value={counts.failed} />
          <Stat label="En file" value={counts.queued} />
        </div>
      </div>

      <nav className="mt-7 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = (item.value || undefined) === filter;
          const href = item.value
            ? `/platform-admin/emails?status=${item.value}`
            : "/platform-admin/emails";

          return (
            <Link
              key={item.value || "all"}
              href={href}
              className={`inline-flex h-9 items-center rounded-full border px-4 text-[0.75rem] font-medium transition-colors ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border text-[0.625rem] uppercase tracking-[0.14em] text-faint">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Gabarit</th>
              <th className="px-5 py-3 font-medium">Destinataire</th>
              <th className="px-5 py-3 font-medium">Objet</th>
              <th className="px-5 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr
                key={message.id}
                className="border-b border-hairline last:border-0"
              >
                <td className="whitespace-nowrap px-5 py-3 text-[0.75rem] text-subtle">
                  {formatDate(message.created_at)}
                </td>
                <td className="px-5 py-3 text-[0.75rem] font-medium text-fg">
                  <Link
                    href={`/platform-admin/emails/${message.id}`}
                    className="hover:text-accent"
                  >
                    {message.template}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[0.75rem] text-subtle">
                  {message.recipient}
                </td>
                <td className="max-w-[280px] truncate px-5 py-3 text-[0.75rem] text-body">
                  {message.subject}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[0.625rem] font-medium ${STATUS_CLASS[message.status]}`}
                  >
                    {STATUS_LABEL[message.status]}
                    {message.status === "failed" && message.attempts > 0
                      ? ` · ${message.attempts}`
                      : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {messages.length === 0 ? (
          <p className="px-5 py-10 text-center text-[0.8125rem] text-subtle">
            Aucun e-mail pour ce filtre.
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-[0.75rem] leading-relaxed text-faint">
        La trace n’est écrite que si `SUPABASE_SERVICE_ROLE_KEY` est configurée.
        Sans elle, les e-mails partent quand même mais ne sont pas historisés.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-2 text-center">
      <p className="text-[1.125rem] font-medium text-fg">{value}</p>
      <p className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
    </div>
  );
}
