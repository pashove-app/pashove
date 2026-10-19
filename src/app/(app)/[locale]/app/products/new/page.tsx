import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
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

  return { title: t.dashboard.products.chooseTitle };
}

/**
 * Choix du type avant toute chose : un physique, un numérique et un service
 * n'ont ni les mêmes champs, ni le même parcours de livraison.
 */
export default async function NewProductTypePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.products;

  const cards: { icon: IconKey; title: string; text: string; href: string }[] = [
    {
      icon: "box",
      title: labels.physicalTitle,
      text: labels.physicalText,
      href: "/app/products/new/physical",
    },
    {
      icon: "download",
      title: labels.digitalTitle,
      text: labels.digitalText,
      href: "/app/products/new/digital",
    },
    {
      icon: "calendar",
      title: labels.serviceTitle,
      text: labels.serviceText,
      href: "/app/products/new/service",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href={path(locale, "/app/products")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.back}
      </Link>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {labels.chooseTitle}
      </h1>
      <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
        {labels.chooseSubtitle}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={path(locale, card.href)}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
              <Icon path={icons[card.icon]} className="h-6 w-6" strokeWidth={1.7} />
            </span>

            <span className="mt-5 text-[1rem] font-medium text-fg">
              {card.title}
            </span>
            <span className="mt-1.5 flex-1 text-[0.8125rem] leading-relaxed text-subtle">
              {card.text}
            </span>

            <span className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent">
              {labels.chooseStart}
              <Icon
                path={icons.arrowRight}
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
