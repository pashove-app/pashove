import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmailMessage } from "@/lib/email/queries";

export const metadata = {
  title: "Pashove · E-mail",
  robots: { index: false, follow: false },
};

export default async function AdminEmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await getEmailMessage(id);

  if (!message) notFound();

  return (
    <div>
      <Link
        href="/platform-admin/emails"
        className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
      >
        ← Tous les e-mails
      </Link>

      <h1 className="mt-4 text-[1.625rem] font-medium tracking-[-0.03em] text-fg">
        {message.subject}
      </h1>

      <dl className="mt-5 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label="Gabarit" value={message.template} />
        <Field label="Destinataire" value={message.recipient} />
        <Field label="Statut" value={message.status} />
        <Field label="Fournisseur" value={message.provider ?? "—"} />
        <Field label="Tentatives" value={String(message.attempts)} />
        <Field
          label="Envoyé le"
          value={
            message.sent_at
              ? new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(message.sent_at))
              : "—"
          }
        />
        {message.provider_id ? (
          <Field label="Identifiant" value={message.provider_id} />
        ) : null}
        {message.last_error ? (
          <div className="sm:col-span-2">
            <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-faint">
              Erreur
            </dt>
            <dd className="mt-1 break-words rounded-lg bg-red-400/10 px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
              {message.last_error}
            </dd>
          </div>
        ) : null}
      </dl>

      <h2 className="mt-8 text-[0.875rem] font-medium text-fg">Aperçu</h2>
      <iframe
        title={`Aperçu de l’e-mail ${message.template}`}
        srcDoc={message.html}
        sandbox=""
        className="mt-3 h-[760px] w-full rounded-2xl border border-border bg-white"
      />

      {message.text_body ? (
        <>
          <h2 className="mt-8 text-[0.875rem] font-medium text-fg">
            Version texte
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface p-5 text-[0.75rem] leading-relaxed whitespace-pre-wrap text-subtle">
            {message.text_body}
          </pre>
        </>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-faint">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[0.8125rem] text-fg">{value}</dd>
    </div>
  );
}
