"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/field";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LAUNCH_COUNTRIES, NEXT_COUNTRIES } from "@/lib/site-content";

const COUNTRIES = [...LAUNCH_COUNTRIES, ...NEXT_COUNTRIES];

/**
 * Pays desservis par un produit physique.
 *
 * « Livrer partout » coche l'absence de restriction : le tableau est alors
 * vide en base. Sinon, seuls les pays cochés sont enregistrés.
 */
export function ShippingCountriesField({
  t,
  label,
  help,
  allLabel,
  initial,
  error,
}: {
  t: Dictionary;
  label: string;
  help: string;
  allLabel: string;
  initial: string[];
  error?: string;
}) {
  const [all, setAll] = useState(initial.length === 0);
  const [selected, setSelected] = useState<string[]>(initial);

  function toggle(code: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, code] : current.filter((value) => value !== code),
    );
  }

  return (
    <div>
      <p className="text-[0.8125rem] font-medium text-body">{label}</p>
      <p className="mt-0.5 text-[0.75rem] text-subtle">{help}</p>

      <div className="mt-3">
        <Checkbox
          name="shippingAll"
          checked={all}
          onChange={(event) => setAll(event.target.checked)}
          label={allLabel}
        />
      </div>

      {!all ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COUNTRIES.map((country) => (
            <div
              key={country.code}
              className="rounded-lg border border-border px-3 py-2"
            >
              <Checkbox
                name="shippingCountry"
                value={country.code}
                checked={selected.includes(country.code)}
                onChange={(event) => toggle(country.code, event.target.checked)}
                label={
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">{country.flag}</span>
                    {t.countries_names[
                      country.code as keyof Dictionary["countries_names"]
                    ] ?? country.code}
                  </span>
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
