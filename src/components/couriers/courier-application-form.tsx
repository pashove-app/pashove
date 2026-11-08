"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import {
  submitCourierApplicationAction,
  type CourierFormState,
} from "@/lib/couriers/actions";

const INITIAL: CourierFormState = { status: "idle" };

const COPY = {
  fr: {
    name: "Nom complet",
    phone: "Téléphone",
    email: "E-mail",
    country: "Pays d’opération",
    countryPlaceholder: "Choisis ton pays",
    countryHint: "Les courses proposées dépendent de ce pays.",
    idLabel: "Pièce d’identité",
    idHint: "Photo recto, lisible, JPEG ou PNG (5 Mo max).",
    selfieLabel: "Selfie",
    selfieHint: "Ouvre la caméra frontale ou choisis une photo récente.",
    submit: "Envoyer mon dossier",
    sending: "Envoi…",
    note:
      "Tes documents restent privés. Ils servent uniquement à vérifier ton identité.",
  },
  en: {
    name: "Full name",
    phone: "Phone",
    email: "Email",
    country: "Operating country",
    countryPlaceholder: "Choose your country",
    countryHint: "Rides offered depend on this country.",
    idLabel: "ID document",
    idHint: "Front photo, readable, JPEG or PNG (5 MB max).",
    selfieLabel: "Selfie",
    selfieHint: "Open the front camera or pick a recent photo.",
    submit: "Send my application",
    sending: "Sending…",
    note: "Your documents stay private. They are only used to verify your identity.",
  },
};

export function CourierApplicationForm({
  locale,
  defaultName,
  defaultEmail,
  defaultPhone,
  countries,
  defaultCountry,
}: {
  locale: "fr" | "en";
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  countries: { code: string; name: string }[];
  defaultCountry: string;
}) {
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const [state, formAction, pending] = useActionState<
    CourierFormState,
    FormData
  >(submitCourierApplicationAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="fullName"
          label={copy.name}
          defaultValue={defaultName}
          autoComplete="name"
          maxLength={120}
        />
        <TextField
          name="phone"
          label={copy.phone}
          type="tel"
          dir="ltr"
          autoComplete="tel"
          defaultValue={defaultPhone}
          maxLength={40}
        />
        <div className="sm:col-span-2">
          <TextField
            name="email"
            label={copy.email}
            type="email"
            dir="ltr"
            autoComplete="email"
            defaultValue={defaultEmail}
            maxLength={254}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor="courier-country"
            className="text-[0.8125rem] font-medium text-[#0A0E1A]"
          >
            {copy.country}
          </label>
          <select
            id="courier-country"
            name="country"
            required
            defaultValue={defaultCountry}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[0.875rem] text-[#0A0E1A] outline-none transition-colors focus:border-brand-500"
          >
            <option value="" disabled>
              {copy.countryPlaceholder}
            </option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <span className="text-[0.6875rem] leading-relaxed text-[#7B8496]">
            {copy.countryHint}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#0A0E1A]">
            <Icon path={icons.file} className="h-4 w-4 text-brand-600" strokeWidth={1.8} />
            {copy.idLabel}
          </span>
          <span className="text-[0.6875rem] leading-relaxed text-[#7B8496]">
            {copy.idHint}
          </span>
          <input
            type="file"
            name="idDocument"
            accept="image/jpeg,image/png,image/webp"
            required
            className="mt-1 text-[0.75rem] text-[#5B6475]"
          />
        </label>

        <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#0A0E1A]">
            <Icon path={icons.user} className="h-4 w-4 text-brand-600" strokeWidth={1.8} />
            {copy.selfieLabel}
          </span>
          <span className="text-[0.6875rem] leading-relaxed text-[#7B8496]">
            {copy.selfieHint}
          </span>
          <input
            type="file"
            name="selfie"
            accept="image/*"
            capture="user"
            required
            className="mt-1 text-[0.75rem] text-[#5B6475]"
          />
        </label>
      </div>

      <p className="text-[0.6875rem] leading-relaxed text-[#8A93A5]">
        {copy.note}
      </p>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? <Spinner /> : <Icon path={icons.route} className="h-4 w-4" strokeWidth={2} />}
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
