import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.products.newTitle };
}

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/products")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t.dashboard.products.back}
      </Link>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.dashboard.products.newTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {t.dashboard.products.newSubtitle}
      </p>

      <ProductForm
        t={t}
        locale={locale}
        currency={store.currency}
        storeSlug={store.slug}
      />
    </div>
  );
}
