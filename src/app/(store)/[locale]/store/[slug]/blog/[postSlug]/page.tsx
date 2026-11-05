import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { MarkdownBody } from "@/components/storefront/markdown-body";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { isLocale, LOCALE_META } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublishedPost } from "@/lib/storefront/blog";
import { loadStorefront } from "@/lib/storefront/queries";
import { publicUrl } from "@/lib/r2/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { locale, slug, postSlug } = await params;
  if (!isLocale(locale)) return {};
  const { store } = await loadStorefront(slug);
  if (!store) return {};

  const post = await getPublishedPost(store.id, postSlug);
  if (!post) return { robots: { index: false, follow: false } };

  const description =
    post.excerpt?.trim() || post.body.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: `${post.title} · ${store.name}`,
    description,
    openGraph: { title: post.title, description },
  };
}

function coverUrl(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("http") ? value : publicUrl(value);
}

export default async function StoreBlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; postSlug: string }>;
}) {
  const { locale: raw, slug, postSlug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const post = await getPublishedPost(store.id, postSlug);
  if (!post) notFound();

  const cover = coverUrl(post.cover_key);
  const tag = LOCALE_META[locale].tag;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <BackLink
              href={path(locale, `/store/${store.slug}/blog`)}
              label="Blog"
            />
            <p className="mt-6 text-[0.75rem] text-faint">
              {post.published_at
                ? new Intl.DateTimeFormat(tag, { dateStyle: "long" }).format(
                    new Date(post.published_at),
                  )
                : ""}
            </p>
            <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.75rem]">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-3 text-[1rem] leading-relaxed text-muted">
                {post.excerpt}
              </p>
            ) : null}

            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="mt-7 w-full rounded-3xl border border-border object-cover"
              />
            ) : null}

            <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-10">
              <MarkdownBody markdown={post.body} />
            </div>
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
