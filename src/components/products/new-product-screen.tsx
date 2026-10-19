import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { ProductType } from "@/lib/products/schema";
import { currentStore } from "@/lib/stores/queries";

const TYPE_LABEL = {
  physical: "physicalTitle",
  digital: "digitalTitle",
  service: "serviceTitle",
} as const;

/** Écran de création commun aux trois types. */
export async function NewProductScreen({
  locale,
  type,
}: {
  locale: Locale;
  type: ProductType;
}) {
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.products;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/products/new")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.chooseTitle}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.newTitle}
        </h1>
        <span className="rounded-full border border-border-soft bg-hairline px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          {labels[TYPE_LABEL[type]]}
        </span>
      </div>

      <p className="mt-2 text-[0.9375rem] text-muted">{labels.newSubtitle}</p>

      <ProductForm
        t={t}
        locale={locale}
        mode="create"
        type={type}
        currency={store.currency}
        storeSlug={store.slug}
        initialImage={null}
        initialFile={null}
      />
    </div>
  );
}
