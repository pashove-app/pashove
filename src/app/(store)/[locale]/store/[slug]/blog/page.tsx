import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale, LOCALE_META } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listPublishedPosts } from "@/lib/storefront/blog";
import { loadStorefront } from "@/lib/storefront/queries";
import { publicUrl } from "@/lib/r2/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { store } = await loadStorefront(slug);
  if (!store) return {};

  return {
    title: `Blog · ${store.name}`,
    description: store.description ?? store.name,
  };
}

function coverUrl(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("http") ? value : publicUrl(value);
}

export default async function StoreBlogPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const posts = await listPublishedPosts(store.id);
  const tag = LOCALE_META[locale].tag;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-12 sm:py-16">
          <h1 className="text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.75rem]">
            Blog
          </h1>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            Les actualités et histoires de {store.name}.
          </p>

          {posts.length === 0 ? (
            <p className="mt-10 rounded-3xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center text-[0.875rem] text-subtle">
              Aucun article pour le moment.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const cover = coverUrl(post.cover_key);
                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/store/${store.slug}/blog/${post.slug}`}
                    className="group overflow-hidden rounded-3xl border border-border bg-surface transition-colors hover:border-border-strong"
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[16/10] w-full bg-gradient-to-br from-brand-500/20 to-transparent" />
                    )}
                    <div className="p-5">
                      <p className="text-[0.6875rem] text-faint">
                        {post.published_at
                          ? new Intl.DateTimeFormat(tag, {
                              dateStyle: "long",
                            }).format(new Date(post.published_at))
                          : ""}
                      </p>
                      <h2 className="mt-2 text-[1.125rem] font-medium leading-snug text-fg group-hover:text-accent">
                        {post.title}
                      </h2>
                      {post.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted">
                          {post.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </main>
    </StorefrontShell>
  );
}
