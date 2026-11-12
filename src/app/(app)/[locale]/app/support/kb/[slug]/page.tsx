import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/i18n/config";
import { CATEGORY_LABELS } from "@/lib/support/display";
import { getSupportArticle } from "@/lib/support/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getSupportArticle(slug);
  return {
    title: article?.title ?? "Centre d’aide",
    robots: { index: false, follow: false },
  };
}

/** Rendu Markdown minimal : titres de niveau 2 et paragraphes. */
function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="mt-6 space-y-4">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="pt-2 text-[1.0625rem] font-medium text-fg"
            >
              {block.slice(3)}
            </h2>
          );
        }

        return (
          <p
            key={index}
            className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-body"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const article = await getSupportArticle(slug);

  if (!article || !article.published) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl">
      <Link
        href={`/${locale}/app/support/kb`}
        className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
      >
        ← Centre d’aide
      </Link>

      <header className="mt-4">
        <p className="text-[0.625rem] uppercase tracking-[0.12em] text-faint">
          {CATEGORY_LABELS[article.category]}
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-subtle">
            {article.excerpt}
          </p>
        ) : null}
      </header>

      <ArticleBody body={article.body} />

      <div className="mt-8 rounded-3xl border border-border bg-surface p-5">
        <p className="text-[0.875rem] font-medium text-fg">
          Besoin d’une réponse personnalisée ?
        </p>
        <Link
          href={`/${locale}/app/support/tickets`}
          className="mt-2 inline-flex h-9 items-center rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600"
        >
          Ouvrir un ticket
        </Link>
      </div>
    </article>
  );
}
