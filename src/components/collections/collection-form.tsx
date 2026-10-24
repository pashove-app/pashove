"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  CollectionCoverField,
  type CollectionCover,
} from "@/components/collections/collection-cover-field";
import { CollectionProductPicker } from "@/components/collections/collection-product-picker";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner, buttonClass } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { saveCollectionAction } from "@/lib/collections/actions";
import type {
  CollectionDetail,
  CollectionProductOption,
} from "@/lib/collections/queries";
import {
  INITIAL_COLLECTION_FORM_STATE,
  type CollectionFormState,
} from "@/lib/collections/types";
import { cn } from "@/lib/cn";
import { publicUrl } from "@/lib/r2/media";

/** Minuscules, chiffres et tirets — l'identifiant public d'une collection. */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Création et édition d'une collection.
 *
 * Le slug se construit à partir du nom tant que le marchand n'y a pas touché ;
 * une fois modifié, il reste le sien. La couverture et l'ordre des produits
 * partent avec le formulaire, la Server Action valide et écrit en une fois.
 */
export function CollectionForm({
  t,
  locale,
  initial,
  products,
}: {
  t: Dictionary;
  locale: Locale;
  initial: CollectionDetail | null;
  products: CollectionProductOption[];
}) {
  const labels = t.dashboard.collections;

  const [state, formAction, pending] = useActionState<
    CollectionFormState,
    FormData
  >(saveCollectionAction, INITIAL_COLLECTION_FORM_STATE);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    initial?.is_published ? "published" : "draft",
  );
  const [selected, setSelected] = useState<string[]>(initial?.productIds ?? []);
  const [cover, setCover] = useState<CollectionCover>(
    initial?.image?.object_key
      ? { id: initial.image_media_id as string, url: publicUrl(initial.image.object_key) }
      : null,
  );

  const fieldError = (key: string) => state.fieldErrors?.[key];

  const serverMessage = state.messageKey
    ? labels.errors[state.messageKey as keyof typeof labels.errors]
    : null;

  const publishBlocked = status === "published" && selected.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={path(locale, "/app/collections")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToCollections}
      </Link>

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {initial ? labels.editTitle : labels.newTitle}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {initial ? labels.editSubtitle : labels.newSubtitle}
        </p>
      </div>

      <form
        action={formAction}
        noValidate
        className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="collectionId" value={initial?.id ?? ""} />
        <input type="hidden" name="imageMediaId" value={cover?.id ?? ""} />
        <input type="hidden" name="status" value={status} />

        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="space-y-5">
              <TextField
                name="name"
                label={labels.nameLabel}
                hint={labels.namePlaceholder}
                icon="layers"
                value={name}
                maxLength={80}
                autoComplete="off"
                error={fieldError("name")}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
              />

              <TextField
                name="slug"
                label={labels.slugLabel}
                hint="nouveautes"
                icon="globe"
                value={slug}
                maxLength={60}
                autoComplete="off"
                dir="ltr"
                error={fieldError("slug")}
                help={labels.slugHelp}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                onBlur={() => setSlug((current) => slugify(current))}
              />

              <TextAreaField
                name="description"
                label={labels.descriptionLabel}
                hint={labels.descriptionPlaceholder}
                value={description}
                maxLength={500}
                rows={4}
                error={fieldError("description")}
                help={labels.descriptionHelp}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <CollectionCoverField
              labels={labels}
              value={cover}
              onChange={setCover}
              error={
                fieldError("imageMediaId") ? labels.errors.collectionMediaInvalid : undefined
              }
            />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {labels.productsLabel}
              </h2>
              <span className="text-[0.6875rem] text-faint">{labels.productsHelp}</span>
            </div>

            {fieldError("productIds") ? (
              <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
                {labels.errors.collectionProductsInvalid}
              </p>
            ) : null}

            <div className="mt-4">
              <CollectionProductPicker
                labels={labels}
                products={products}
                value={selected}
                onChange={setSelected}
              />
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.statusLabel}</h2>
            <p className="mt-1 text-[0.75rem] text-subtle">{labels.statusHelp}</p>

            <div
              role="group"
              aria-label={labels.statusLabel}
              className="mt-3 inline-flex w-full rounded-full border border-border bg-bg-soft p-1"
            >
              {(
                [
                  { key: "draft", label: labels.statusDraft },
                  { key: "published", label: labels.statusPublished },
                ] as const
              ).map((option) => {
                const active = status === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(option.key)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                      active
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-subtle hover:text-fg",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {publishBlocked ? (
              <p className="mt-3 text-[0.75rem] text-amber-600 dark:text-amber-400">
                {labels.publishHint}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            {serverMessage ? (
              <p
                role="alert"
                className="mb-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-500 dark:text-red-400"
              >
                {serverMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending || publishBlocked}
              className={buttonClass({ variant: "primary", className: "w-full" })}
            >
              {pending ? (
                <>
                  <Spinner />
                  {labels.saving}
                </>
              ) : initial ? (
                labels.save
              ) : (
                labels.create
              )}
            </button>

            <Link
              href={path(locale, "/app/collections")}
              className={buttonClass({
                variant: "ghost",
                className: "mt-2 w-full",
              })}
            >
              {labels.cancel}
            </Link>
          </section>
        </aside>
      </form>
    </div>
  );
}
