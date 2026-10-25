import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";
import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  canManageTeam,
  currentMembership,
  type StoreRole,
} from "@/lib/stores/queries";
import { revokeInvitationAction } from "@/lib/team/actions";
import {
  listTeamInvitations,
  listTeamMembers,
  readAccountPlan,
} from "@/lib/team/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.team.title };
}

const ROLE_LABEL: Record<StoreRole, "roleOwner" | "roleAdmin" | "roleProductManager" | "roleStaff"> = {
  owner: "roleOwner",
  admin: "roleAdmin",
  product_manager: "roleProductManager",
  staff: "roleStaff",
};

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { updated } = await searchParams;

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.team;
  const storeLabels = t.dashboard.stores;

  if (!canManageTeam(membership.role)) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <BackLink href={path(locale, "/app/settings")} label={labels.backToSettings} />
        <p className="mt-6 rounded-3xl border border-border bg-surface p-6 text-[0.875rem] text-muted">
          {labels.accessDenied}
        </p>
      </div>
    );
  }

  const [members, invitations, plan] = await Promise.all([
    listTeamMembers(membership.store.id),
    listTeamInvitations(membership.store.id),
    readAccountPlan(),
  ]);

  const pending = invitations.filter((invite) => invite.status === "pending");
  const used = members.length + pending.length;

  const roleLabel = (role: StoreRole) =>
    storeLabels[ROLE_LABEL[role]];

  const date = (value: string) =>
    new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const invitationStatus = (status: string) =>
    status === "accepted"
      ? labels.accepted
      : status === "revoked"
        ? labels.revoked
        : status === "expired"
          ? labels.expired
          : labels.pending;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href={path(locale, "/app/settings")} label={labels.backToSettings} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 max-w-xl text-[0.875rem] leading-relaxed text-muted">
            {labels.subtitle}
          </p>
        </div>

        <span className="rounded-full bg-hairline px-3 py-1.5 text-[0.75rem] font-medium text-subtle">
          {labels.planUsage
            .replace("{used}", String(used))
            .replace("{max}", String(plan.max_members))}
        </span>
      </div>

      {updated ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
          {labels.inviteSent}
        </p>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.membersTitle}
          </h2>
        </div>

        <ul className="divide-y divide-hairline">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[0.75rem] font-semibold uppercase text-accent">
                {member.full_name.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.875rem] font-medium text-fg">
                  {member.full_name}
                </p>
                <p dir="ltr" className="truncate text-[0.75rem] text-subtle">
                  {member.email}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-subtle">
                {roleLabel(member.role)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          {labels.invitationsTitle}
        </h2>
        <p className="mt-1 text-[0.8125rem] text-subtle">{labels.subtitle}</p>

        <div className="mt-5">
          <InviteMemberForm t={t} locale={locale} />
        </div>
      </section>

      {invitations.length > 0 ? (
        <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
          <ul className="divide-y divide-hairline">
            {invitations.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p dir="ltr" className="truncate text-[0.875rem] font-medium text-fg">
                    {invite.email}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {roleLabel(invite.role)} ·{" "}
                    {labels.expiresOn.replace("{date}", date(invite.expires_at))}
                  </p>
                </div>

                <span
                  className={
                    invite.status === "pending"
                      ? "shrink-0 rounded-full bg-brand-500/10 px-2.5 py-1 text-[0.6875rem] font-medium text-accent"
                      : "shrink-0 rounded-full bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-faint"
                  }
                >
                  {invitationStatus(invite.status)}
                </span>

                {invite.status === "pending" ? (
                  <form action={revokeInvitationAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={invite.id} />
                    <button
                      type="submit"
                      className="text-[0.6875rem] font-medium text-subtle transition-colors hover:text-red-500"
                    >
                      {labels.revoke}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
