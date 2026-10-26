import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  customerEntitlements,
  getCustomerUser,
} from "@/lib/customer/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomerDownloadsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (!user) redirect(`/${locale}/store/${slug}/account/login`);

  const [entitlements, t] = await Promise.all([
    customerEntitlements(slug),
    getDictionary(locale),
  ]);
  const labels = t.customer;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={path(locale, `/store/${slug}/account`)}
        className="text-[0.8125rem] font-medium text-accent hover:underline"
      >
        ← {labels.accountTitle}
      </Link>

      <h1 className="mt-4 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {labels.downloads}
      </h1>

      {entitlements.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.1] text-accent">
            <Icon path={icons.file} className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            {labels.noDownloads}
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {labels.noDownloadsText}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {entitlements.map((item) => {
            const remaining = item.maxDownloads - item.downloadCount;
            const available = item.status === "available" && remaining > 0;

            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-medium text-fg">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-subtle">
                      #{item.orderNumber}
                      {item.fileName ? ` · ${item.fileName}` : ""}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-faint">
                      {labels.remaining.replace(
                        "{count}",
                        String(Math.max(remaining, 0)),
                      )}
                    </p>
                  </div>

                  {available ? (
                    <a
                      href={path(
                        locale,
                        `/store/${slug}/account/downloads/${item.id}`,
                      )}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
                    >
                      <Icon
                        path={icons.download}
                        className="h-4 w-4"
                        strokeWidth={2}
                      />
                      {labels.download}
                    </a>
                  ) : (
                    <span className="rounded-full bg-hairline px-3 py-1.5 text-[0.6875rem] font-medium text-faint">
                      {item.status === "revoked"
                        ? labels.statusRevoked
                        : item.status === "expired"
                          ? labels.statusExpired
                          : labels.downloadUnavailable}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
