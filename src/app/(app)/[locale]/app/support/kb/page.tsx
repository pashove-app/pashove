import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale } from "@/i18n/config";
import { CATEGORY_LABELS } from "@/lib/support/display";
import { listSupportArticles } from "@/lib/support/queries";

export const metadata: Metadata = {
  title: "Centre d’aide",
  robots: { index: false, follow: false },
};

export default async function KnowledgeBasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const articles = await listSupportArticles();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={`/${locale}/app/support`}
        className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
      >
        ← Support
      </Link>

      <header className="mt-4">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Centre d’aide
        </h1>
        <p className="mt-1 text-[0.8125rem] text-subtle">
          Les réponses aux questions les plus fréquentes.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-border bg-surface px-5 py-10 text-center text-[0.875rem] text-subtle">
          Aucun article publié pour l’instant.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/${locale}/app/support/kb/${article.slug}`}
                className="block px-5 py-4 transition-colors hover:bg-hairline/40"
              >
                <p className="text-[0.875rem] font-medium text-fg">
                  {article.title}
                </p>
                {article.excerpt ? (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                    {article.excerpt}
                  </p>
                ) : null}
                <p className="mt-1 text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                  {CATEGORY_LABELS[article.category]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
