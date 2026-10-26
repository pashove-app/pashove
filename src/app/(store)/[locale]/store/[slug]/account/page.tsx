import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { customerSignOutAction } from "@/lib/customer/actions";
import {
  customerBookings,
  customerEntitlements,
  customerOrders,
  getCustomerUser,
} from "@/lib/customer/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomerAccountPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (!user) redirect(`/${locale}/store/${slug}/account/login`);

  const [orders, entitlements, bookings, t] = await Promise.all([
    customerOrders(slug),
    customerEntitlements(slug),
    customerBookings(slug),
    getDictionary(locale),
  ]);
  const labels = t.customer;

  const name =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "";

  const cards: {
    href: string;
    icon: IconKey;
    title: string;
    hint: string;
    count: number;
  }[] = [
    {
      href: path(locale, `/store/${slug}/account/orders`),
      icon: "bag",
      title: labels.orders,
      hint: labels.ordersHint,
      count: orders.length,
    },
    {
      href: path(locale, `/store/${slug}/account/downloads`),
      icon: "file",
      title: labels.downloads,
      hint: labels.downloadsHint,
      count: entitlements.length,
    },
    {
      href: path(locale, `/store/${slug}/account/bookings`),
      icon: "calendar",
      title: labels.bookings,
      hint: labels.bookingsHint,
      count: bookings.length,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.accountTitle}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-muted">
            {labels.hello.replace("{name}", name)} · {labels.subtitle}
          </p>
        </div>

        <form action={customerSignOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[0.8125rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
          >
            {labels.logout}
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            style={{ animationDelay: `${index * 70}ms` }}
            className="group animate-rise rounded-3xl border border-border bg-surface p-5 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/[0.1] text-accent">
                <Icon path={icons[card.icon]} className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="text-[1.5rem] font-semibold tabular-nums text-fg">
                {card.count}
              </span>
            </div>
            <p className="mt-4 text-[0.9375rem] font-medium text-fg">
              {card.title}
            </p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-subtle">
              {card.hint}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={path(locale, `/store/${slug}`)}
          className="text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
        >
          {labels.backToStore}
        </Link>
      </div>
    </div>
  );
}
