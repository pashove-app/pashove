import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { MarkdownBody } from "@/components/storefront/markdown-body";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublishedCustomPage } from "@/lib/storefront/custom-pages";
import { policySlugFromUrl, type PolicySlug } from "@/lib/policies/pages";
import { getPublishedPolicyPage } from "@/lib/policies/queries";
import { loadStorefront } from "@/lib/storefront/queries";

type LabelKey = "mentions" | "terms" | "privacy" | "shipping" | "returns";

const LABEL: Record<PolicySlug, LabelKey> = {
  mentions: "mentions",
  terms: "terms",
  privacy: "privacy",
  shipping: "shipping",
  returns: "returns",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; page: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug, page: rawPage } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale = resolveLocale(rawLocale);

  const { store } = await loadStorefront(slug);
  if (!store) return {};

  const slugKey = policySlugFromUrl(rawPage);

  if (slugKey) {
    const page = await getPublishedPolicyPage(store.id, slugKey);
    if (!page) return { robots: { index: false, follow: false } };

    const t = await getDictionary(locale);
    const title = `${t.policies[LABEL[slugKey]]} · ${store.name}`;
    const description = page.body.replace(/\s+/g, " ").trim().slice(0, 160);

    return { title, description, openGraph: { title, description } };
  }

  const page = await getPublishedCustomPage(store.id, rawPage);
  if (!page) return { robots: { index: false, follow: false } };

  const description =
    page.body.replace(/\s+/g, " ").trim().slice(0, 160) || store.name;

  return {
    title: `${page.title} · ${store.name}`,
    description,
    openGraph: { title: page.title, description },
  };
}

export default async function StoreCustomPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; page: string }>;
}) {
  const { locale: rawLocale, slug, page: rawPage } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = resolveLocale(rawLocale);

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const slugKey = policySlugFromUrl(rawPage);

  if (slugKey) {
    const page = await getPublishedPolicyPage(store.id, slugKey);
    if (!page) notFound();

    const date = page.updated_at
      ? new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
          dateStyle: "long",
        }).format(new Date(page.updated_at))
      : null;

    return (
      <StorefrontShell store={store} locale={locale} t={t}>
        <StorefrontHeader store={store} locale={locale} t={t} />
        <main>
          <Container className="py-12 sm:py-16">
            <div className="mx-auto max-w-3xl">
              <BackLink
                href={path(locale, `/store/${store.slug}`)}
                label={t.storefront.navHome}
              />

              <h1 className="mt-6 text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
                {t.policies[LABEL[slugKey]]}
              </h1>
              {date ? (
                <p className="mt-2 text-[0.8125rem] text-faint">
                  {t.policies.updated.replace("{date}", date)}
                </p>
              ) : null}

              <article className="mt-8 whitespace-pre-line rounded-3xl border border-border bg-surface p-6 text-[0.9375rem] leading-7 text-body sm:p-10">
                {page.body}
              </article>
            </div>
          </Container>
        </main>
      </StorefrontShell>
    );
  }

  const page = await getPublishedCustomPage(store.id, rawPage);
  if (!page) notFound();

  const date = new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
    dateStyle: "long",
  }).format(new Date(page.updated_at));

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <BackLink
              href={path(locale, `/store/${store.slug}`)}
              label={t.storefront.navHome}
            />
            <h1 className="mt-6 text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
              {page.title}
            </h1>
            <p className="mt-2 text-[0.8125rem] text-faint">
              {t.policies.updated.replace("{date}", date)}
            </p>
            <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-10">
              <MarkdownBody markdown={page.body} />
            </div>
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
