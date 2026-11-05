"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SelectField, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { GiftCopy } from "@/lib/gifts/copy";
import { claimGiftAction } from "@/lib/gifts/actions";
import type { GiftClaimState, GiftInfo } from "@/lib/gifts/types";
import type { ServiceSlot } from "@/lib/storefront/service-slots";

const INITIAL: GiftClaimState = { status: "idle" };

export function GiftClaimForm({
  token,
  locale,
  info,
  slots,
  copy,
  countries,
  loggedIn,
  accountHref,
}: {
  token: string;
  locale: string;
  info: GiftInfo;
  slots: ServiceSlot[];
  copy: GiftCopy;
  countries: { code: string; label: string }[];
  loggedIn: boolean;
  accountHref: string;
}) {
  const [state, action, pending] = useActionState(claimGiftAction, INITIAL);

  const error = state.messageKey
    ? (copy.claim[state.messageKey as keyof typeof copy.claim] as
        | string
        | undefined) ?? copy.claim.errorGeneric
    : null;

  const serviceBlocked = info.hasService && slots.length === 0;

  return (
    <div>
      {!loggedIn ? (
        <div className="mb-5 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
          <Link
            href={accountHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
          >
            {copy.claim.createAccount}
          </Link>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-subtle">
            {copy.claim.createAccountHint}
          </p>
        </div>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="locale" value={locale} />

        {info.hasPhysical ? (
          <div>
            <h3 className="text-[0.9375rem] font-medium text-fg">
              {copy.claim.physicalTitle}
            </h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.claim.physicalText}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                name="phone"
                label={copy.claim.phone}
                type="tel"
                dir="ltr"
                autoComplete="tel"
                maxLength={40}
              />
              <SelectField
                name="country"
                label={copy.claim.country}
                defaultValue="SN"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                name="city"
                label={copy.claim.city}
                autoComplete="address-level2"
                maxLength={100}
                required
              />
              <TextField
                name="address"
                label={copy.claim.address}
                autoComplete="street-address"
                maxLength={200}
                required
              />
              <div className="sm:col-span-2">
                <TextField
                  name="extra"
                  label={copy.claim.extra}
                  autoComplete="address-line2"
                  maxLength={200}
                />
              </div>
            </div>
          </div>
        ) : null}

        {info.hasService ? (
          <div>
            <h3 className="text-[0.9375rem] font-medium text-fg">
              {copy.claim.serviceTitle}
            </h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.claim.serviceText}
            </p>

            {slots.length > 0 ? (
              <div className="mt-4">
                <SelectField name="serviceStartsAt" label={copy.claim.slot} required>
                  {slots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.dateLabel} · {slot.timeLabel}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
                {copy.claim.noSlots}
              </p>
            )}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || serviceBlocked}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? <Spinner /> : null}
          {pending
            ? copy.claim.claiming
            : loggedIn
              ? copy.claim.claim
              : copy.claim.guest}
        </button>

        {!loggedIn ? (
          <p className="text-center text-[0.75rem] leading-relaxed text-faint">
            {copy.claim.guestHint}
          </p>
        ) : null}
      </form>
    </div>
  );
}
