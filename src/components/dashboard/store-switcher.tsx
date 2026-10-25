"use client";

import Link from "next/link";
import { switchStoreAction } from "@/lib/stores/actions";
import type { StoreRole } from "@/lib/stores/queries";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import { Icon, icons } from "@/components/ui/primitives";

export type StoreOption = {
  id: string;
  name: string;
  slug: string;
  role: StoreRole;
};

/** Sélecteur de la boutique active, dans la sidebar. */export function StoreSwitcher({
  stores,
  activeStoreId,
  locale,
  labels,
}: {
  stores: StoreOption[];
  activeStoreId: string;
  locale: Locale;
  labels: {
    activeLabel: string;
    newStore: string;
  };
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5">
      <p className="px-1 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-white/40">
        {labels.activeLabel}
      </p>

      <form action={switchStoreAction} className="relative mt-1.5">
        <input type="hidden" name="locale" value={locale} />
        <select
          name="storeId"
          defaultValue={activeStoreId}
          aria-label={labels.activeLabel}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#0a1330] ps-3 pe-9 text-[0.8125rem] font-medium text-white outline-none transition-colors focus:border-white/30"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

        <Icon
          path={icons.chevronDown}
          className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50"
          strokeWidth={2}
        />

        <button type="submit" className="sr-only">
          {labels.activeLabel}
        </button>
      </form>

      <Link
        href={path(locale, "/app/stores/new")}
        className="mt-2 flex h-8 items-center gap-1.5 rounded-lg px-1 text-[0.6875rem] font-medium text-white/55 transition-colors hover:text-white"
      >
        <Icon path={icons.plus} className="h-3.5 w-3.5" strokeWidth={2.4} />
        {labels.newStore}
      </Link>
    </div>
  );
}
