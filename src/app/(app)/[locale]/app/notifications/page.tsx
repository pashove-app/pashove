import type { Metadata } from "next";
import Link from "next/link";
import { markNotificationsReadAction } from "@/lib/notifications/actions";
import { listNotifications } from "@/lib/notifications/queries";
import { resolveLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

function formatDate(value: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const notifications = await listNotifications(50);
  const unread = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Espace marchand
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            Notifications
          </h1>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {unread > 0
              ? `${unread} notification${unread === 1 ? "" : "s"} non lue${unread === 1 ? "" : "s"}.`
              : "Tout est à jour."}
          </p>
        </div>

        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
            >
              Marquer tout comme lu
            </button>
          </form>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-border bg-surface px-5 py-10 text-center text-[0.875rem] text-subtle">
          Aucune notification pour l’instant. Les commandes, retraits et
          vérifications apparaîtront ici.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.href ?? `/${locale}/app`}
                className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-hairline/40"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    notification.readAt ? "bg-transparent" : "bg-brand-500"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.875rem] font-medium text-fg">
                    {notification.title}
                  </span>
                  {notification.body ? (
                    <span className="mt-1 block text-[0.8125rem] leading-relaxed text-subtle">
                      {notification.body}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[0.6875rem] text-faint">
                  {formatDate(notification.createdAt, "fr-FR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
