import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  customerBookings,
  getCustomerUser,
} from "@/lib/customer/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomerBookingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (!user) redirect(`/${locale}/store/${slug}/account/login`);

  const [bookings, t] = await Promise.all([
    customerBookings(slug),
    getDictionary(locale),
  ]);
  const labels = t.customer;
  const tag = LOCALE_META[locale].tag;

  const date = (value: string) =>
    new Intl.DateTimeFormat(tag, {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Abidjan",
    }).format(new Date(value));

  const statusLabel = (status: string) =>
    status === "cancelled"
      ? labels.bookingCancelled
      : status === "completed"
        ? labels.bookingCompleted
        : labels.bookingConfirmed;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={path(locale, `/store/${slug}/account`)}
        className="text-[0.8125rem] font-medium text-accent hover:underline"
      >
        ← {labels.accountTitle}
      </Link>

      <h1 className="mt-4 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {labels.bookings}
      </h1>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.1] text-accent">
            <Icon path={icons.calendar} className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            {labels.noBookings}
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {labels.noBookingsText}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-3xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[0.9375rem] font-medium text-fg">
                    {booking.productName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-subtle">
                    <Icon
                      path={icons.calendar}
                      className="h-3.5 w-3.5"
                      strokeWidth={1.8}
                    />
                    {date(booking.startsAt)}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-faint">
                    #{booking.orderNumber} · {booking.durationMinutes} min
                  </p>
                </div>

                <span
                  className={
                    booking.status === "confirmed"
                      ? "rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-700 dark:text-emerald-300"
                      : "rounded-full bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-faint"
                  }
                >
                  {statusLabel(booking.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
