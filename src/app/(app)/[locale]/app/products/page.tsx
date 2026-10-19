import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductEmptyState } from "@/components/products/product-empty-state";
import { ProductList } from "@/components/products/product-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listProducts } from "@/lib/products/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.products.title };
}

/** Liste des produits de la boutique. */
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { created } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const products = await listProducts();
  const t = await getDictionary(locale);

  const count = products.length;
  const countLabel = (
    count === 1 ? t.dashboard.products.count : t.dashboard.products.countPlural
  ).replace("{count}", String(count));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {t.dashboard.products.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-muted">{countLabel}</p>
        </div>

        <ButtonLink href={path(locale, "/app/products/new")}>
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {t.dashboard.products.add}
        </ButtonLink>
      </div>

      {created ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {t.dashboard.products.created}
        </p>
      ) : null}

      {products.length === 0 ? (
        <ProductEmptyState t={t} locale={locale} />
      ) : (
        <ProductList
          t={t}
          locale={locale}
          products={products}
          currency={store.currency}
        />
      )}
    </div>
  );
}
