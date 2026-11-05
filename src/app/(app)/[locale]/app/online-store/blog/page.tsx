import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BlogManager } from "@/components/app/blog-manager";
import { resolveLocale } from "@/i18n/config";
import { getStoreAdminCopy } from "@/lib/storefront/admin-copy";
import { getPost, listAllPosts } from "@/lib/storefront/blog";
import { currentMembership } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getStoreAdminCopy(resolveLocale(raw)).blog.title };
}

export default async function BlogAdminPage({
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

  const [posts, editing] = await Promise.all([
    listAllPosts(membership.store.id),
    edit ? getPost(membership.store.id, edit) : Promise.resolve(null),
  ]);

  const copy = getStoreAdminCopy(locale);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {copy.blog.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {copy.blog.subtitle}
      </p>

      {saved || deleted ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2 text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-300">
          {saved ? copy.blog.saved : copy.blog.deleted}
        </p>
      ) : null}

      <BlogManager
        locale={locale}
        slug={membership.store.slug}
        posts={posts}
        editing={editing}
        labels={copy.blog}
      />
    </div>
  );
}
