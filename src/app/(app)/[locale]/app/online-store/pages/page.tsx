import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageManager } from "@/components/app/page-manager";
import { resolveLocale } from "@/i18n/config";
import { getStoreAdminCopy } from "@/lib/storefront/admin-copy";
import { getCustomPage, listCustomPages } from "@/lib/storefront/custom-pages";
import { currentMembership } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  return { title: getStoreAdminCopy(locale).pages.title };
}

export default async function StorePagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; saved?: string; deleted?: string }>;
}) {
  const { locale: raw } = await params;
  const { edit, saved, deleted } = await searchParams;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const [pages, editing] = await Promise.all([
    listCustomPages(membership.store.id),
    edit ? getCustomPage(membership.store.id, edit) : Promise.resolve(null),
  ]);

  const copy = getStoreAdminCopy(locale);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {copy.pages.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {copy.pages.subtitle}
      </p>

      {saved ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2 text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-300">
          {copy.pages.saved}
        </p>
      ) : null}
      {deleted ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2 text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-300">
          {copy.pages.deleted}
        </p>
      ) : null}

      <PageManager
        locale={locale}
        slug={membership.store.slug}
        pages={pages}
        editing={editing}
        labels={copy.pages}
      />
    </div>
  );
}
