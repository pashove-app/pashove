import type { Metadata } from "next";
import Link from "next/link";
import {
  createArticleAction,
  createMacroAction,
} from "@/lib/support/actions";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  isTicketOverdue,
  slaText,
} from "@/lib/support/display";
import {
  listSupportArticles,
  listSupportMacros,
  listSupportTickets,
} from "@/lib/support/queries";

export const metadata: Metadata = {
  title: "Pashove · Support",
  robots: { index: false, follow: false },
};

const FIELD =
  "mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "open", label: "Ouverts" },
  { value: "pending", label: "En attente" },
  { value: "resolved", label: "Résolus" },
] as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; ok?: string; error?: string }>;
}) {
  const { tab = "tickets", status = "all", ok, error } = await searchParams;
  const activeTab = ["tickets", "macros", "articles"].includes(tab) ? tab : "tickets";

  const [tickets, macros, articles] = await Promise.all([
    listSupportTickets({ status }),
    listSupportMacros(),
    listSupportArticles({ includeDrafts: true }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Relation marchands
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Support
        </h1>
        <p className="mt-1 text-[0.8125rem] text-subtle">
          Tickets, SLA, réponses types et base de connaissances.
        </p>
      </header>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Enregistré.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Vérifie les champs et réessaie.
        </p>
      ) : null}

      <nav className="mt-5 flex flex-wrap gap-2">
        {[
          { value: "tickets", label: "Tickets" },
          { value: "macros", label: "Macros" },
          { value: "articles", label: "Articles" },
        ].map((item) => (
          <Link
            key={item.value}
            href={`/platform-admin/support?tab=${item.value}`}
            className={`inline-flex h-9 items-center rounded-full border px-4 text-[0.75rem] font-medium ${
              activeTab === item.value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-border bg-surface text-body hover:border-border-strong"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {activeTab === "tickets" ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <Link
                key={item.value}
                href={`/platform-admin/support?tab=tickets&status=${item.value}`}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-[0.6875rem] font-medium ${
                  status === item.value
                    ? "border-brand-500 bg-brand-500/10 text-accent"
                    : "border-border bg-surface text-subtle"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
            {tickets.length === 0 ? (
              <p className="px-6 py-10 text-center text-[0.8125rem] text-subtle">
                Aucun ticket.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/platform-admin/support/${ticket.id}`}
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
                        {ticket.store_name ?? "Boutique"} ·{" "}
                        {CATEGORY_LABELS[ticket.category]} ·{" "}
                        {PRIORITY_LABELS[ticket.priority]} ·{" "}
                        {ticket.message_count} message
                        {ticket.message_count === 1 ? "" : "s"} · {slaText(ticket)}
                      </p>
                      {isTicketOverdue(ticket) ? (
                        <p className="mt-1 text-[0.6875rem] font-medium text-red-500 dark:text-red-400">
                          SLA dépassé
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {activeTab === "macros" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-hairline px-5 py-4">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                Réponses types
              </h2>
            </div>
            {macros.length === 0 ? (
              <p className="px-6 py-8 text-center text-[0.8125rem] text-subtle">
                Aucune macro.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {macros.map((macro) => (
                  <li key={macro.id} className="px-5 py-3">
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {macro.title}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-subtle">
                      {CATEGORY_LABELS[macro.category]}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[0.75rem] text-muted">
                      {macro.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form
            action={createMacroAction}
            className="rounded-3xl border border-border bg-surface p-5"
          >
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Nouvelle macro
            </h2>
            <label className="mt-3 block">
              <span className="block text-[0.6875rem] text-subtle">Titre</span>
              <input name="title" required maxLength={80} className={FIELD} />
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">
                Catégorie
              </span>
              <select name="category" className={FIELD} defaultValue="other">
                <option value="payments">Paiements</option>
                <option value="orders">Commandes</option>
                <option value="inventory">Stock</option>
                <option value="delivery">Livraison</option>
                <option value="account">Compte</option>
                <option value="other">Autre</option>
              </select>
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">Texte</span>
              <textarea
                name="body"
                required
                rows={6}
                maxLength={4000}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] text-fg"
              />
            </label>
            <button
              type="submit"
              className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600"
            >
              Enregistrer
            </button>
          </form>
        </div>
      ) : null}

      {activeTab === "articles" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-hairline px-5 py-4">
              <h2 className="text-[0.9375rem] font-medium text-fg">Articles</h2>
            </div>
            {articles.length === 0 ? (
              <p className="px-6 py-8 text-center text-[0.8125rem] text-subtle">
                Aucun article.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {articles.map((article) => (
                  <li key={article.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.8125rem] font-medium text-fg">
                        {article.title}
                      </p>
                      <span className="font-mono text-[0.625rem] text-faint">
                        /{article.slug}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] text-subtle">
                      {CATEGORY_LABELS[article.category]} ·{" "}
                      {article.published ? "Publié" : "Brouillon"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form
            action={createArticleAction}
            className="rounded-3xl border border-border bg-surface p-5"
          >
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Nouvel article
            </h2>
            <label className="mt-3 block">
              <span className="block text-[0.6875rem] text-subtle">Slug</span>
              <input
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                placeholder="recevoir-ses-paiements"
                className={FIELD}
              />
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">Titre</span>
              <input name="title" required maxLength={140} className={FIELD} />
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">
                Chapô (facultatif)
              </span>
              <input name="excerpt" maxLength={300} className={FIELD} />
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">
                Catégorie
              </span>
              <select name="category" className={FIELD} defaultValue="other">
                <option value="payments">Paiements</option>
                <option value="orders">Commandes</option>
                <option value="inventory">Stock</option>
                <option value="delivery">Livraison</option>
                <option value="account">Compte</option>
                <option value="other">Autre</option>
              </select>
            </label>
            <label className="mt-2 block">
              <span className="block text-[0.6875rem] text-subtle">
                Contenu (## pour un titre)
              </span>
              <textarea
                name="body"
                required
                rows={8}
                maxLength={20000}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] text-fg"
              />
            </label>
            <button
              type="submit"
              className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600"
            >
              Publier
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
