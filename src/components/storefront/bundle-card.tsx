import Image from "next/image";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import type { PublicBundle } from "@/lib/storefront/bundles";

export function BundleCard({
  bundle,
  storeSlug,
  locale,
  labels,
}: {
  bundle: PublicBundle;
  storeSlug: string;
  locale: Locale;
  labels: Dictionary["storefront"];
}) {
  return (
    <Link
      href={path(locale, `/store/${storeSlug}/bundles/${bundle.slug}`)}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hairline">
        {bundle.image_key ? (
          <Image
            src={publicUrl(bundle.image_key)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(47,92,255,0.16),rgba(47,92,255,0.04))] text-accent">
            <Icon path={icons.bundle} className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}

        <span className="absolute start-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
          {labels.bundleSave.replace("{amount}", bundle.savingsLabel)}
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate text-[0.9375rem] font-medium text-fg transition-colors group-hover:text-accent">
          {bundle.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-subtle">
          {bundle.description ?? labels.bundlesSubtitle}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-[1rem] font-semibold tabular-nums text-fg">
            {bundle.priceLabel}
          </p>
          <p className="text-[0.75rem] tabular-nums text-faint line-through">
            {bundle.sumLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}
