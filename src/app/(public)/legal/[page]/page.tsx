import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_DOCUMENTS, legalDocument } from "@/lib/legal/content";

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((document) => ({ page: document.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const document = legalDocument(page);
  if (!document) return {};

  return {
    title: `${document.title} · Pashove`,
    description: document.intro.slice(0, 160),
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const document = legalDocument(page);
  if (!document) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-[1rem] font-semibold tracking-[-0.03em] text-fg">
            Pashove
          </span>
          <nav className="flex gap-3 text-[0.75rem] text-subtle">
            {LEGAL_DOCUMENTS.map((item) => (
              <Link
                key={item.slug}
                href={`/legal/${item.slug}`}
                className={
                  item.slug === document.slug
                    ? "font-medium text-fg"
                    : "transition-colors hover:text-fg"
                }
              >
                {item.slug === "cgu" ? "CGU" : item.title.split(" ")[0]}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
          Document provisoire — à compléter et à faire valider juridiquement
          avant le lancement public.
        </div>

        <h1 className="mt-8 text-[2rem] font-semibold tracking-[-0.035em] text-fg sm:text-[2.5rem]">
          {document.title}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {document.intro}
        </p>

        <div className="mt-10 space-y-8">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-[1.0625rem] font-medium text-fg">
                {section.title}
              </h2>
              <div className="mt-3 space-y-2 text-[0.9375rem] leading-7 text-body">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-border pt-6 text-[0.75rem] text-faint">
          Pashove · contact@pashove.com
        </p>
      </main>
    </div>
  );
}
