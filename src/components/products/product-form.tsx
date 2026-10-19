"use client";

import { useActionState, useState } from "react";
import { MediaUploader } from "@/components/media/media-uploader";
import { FormNotice, TextAreaField, TextField } from "@/components/ui/field";
import { buttonClass, ButtonLink, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { useFieldErrors } from "@/lib/forms/use-field-errors";
import { createProductAction } from "@/lib/products/actions";
import { INITIAL_PRODUCT_FORM_STATE } from "@/lib/products/types";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/cn";

type Status = "draft" | "published";

/**
 * Formulaire de création d'un produit.
 *
 * L'adresse suit le nom tant que le marchand ne l'a pas corrigée ; le prix est
 * saisi en unité majeure et converti côté serveur. L'image passe par le
 * téléverseur R2, jamais par une URL collée.
 */
export function ProductForm({
  t,
  locale,
  currency,
  storeSlug,
}: {
  t: Dictionary;
  locale: Locale;
  currency: string;
  storeSlug: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    INITIAL_PRODUCT_FORM_STATE,
  );

  const { corrected, clear } = useFieldErrors(state);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<Status>("draft");

  const errors = t.dashboard.products.errors as Record<string, string>;
  const fieldError = (key: string) => {
    if (corrected[key]) return undefined;
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const message = state.messageKey ? errors[state.messageKey] : undefined;

  return (
    <form action={formAction} noValidate className="mt-8 space-y-7">
      <input type="hidden" name="locale" value={locale} />

      <TextField
        name="name"
        label={t.dashboard.products.nameLabel}
        hint={t.dashboard.products.nameHint}
        icon="tag"
        value={name}
        error={fieldError("name")}
        onChange={(event) => {
          clear("name");
          setName(event.target.value);
          if (!slugTouched) setSlug(slugify(event.target.value));
        }}
      />

      <TextField
        name="slug"
        label={t.dashboard.products.slugLabel}
        dir="ltr"
        maxLength={60}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={slug}
        error={fieldError("slug")}
        help={t.dashboard.products.slugHelp}
        addon={
          <span
            dir="ltr"
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-hairline-strong bg-hairline px-3 py-1.5 font-mono text-[0.75rem] text-muted"
          >
            <Icon path={icons.globe} className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
            <span className="truncate">
              /store/{storeSlug}/products/{slug || "…"}
            </span>
          </span>
        }
        onChange={(event) => {
          clear("slug");
          setSlugTouched(true);
          setSlug(slugify(event.target.value));
        }}
      />

      <TextAreaField
        name="description"
        label={t.dashboard.products.descriptionLabel}
        help={t.dashboard.products.descriptionHelp}
        rows={6}
        maxLength={5000}
        error={fieldError("description")}
        onChange={() => clear("description")}
      />

      <TextField
        name="price"
        label={t.dashboard.products.priceLabel}
        help={t.dashboard.products.priceHelp.replace("{currency}", currency)}
        icon="wallet"
        dir="ltr"
        inputMode="decimal"
        autoComplete="off"
        error={fieldError("price")}
        onChange={() => clear("price")}
      />

      <MediaUploader
        name="productMediaId"
        kind="product"
        label={t.dashboard.products.imageLabel}
        help={t.dashboard.products.imageHelp}
        initial={null}
        labels={{
          choose: t.settings.uploadChoose,
          replace: t.settings.uploadReplace,
          remove: t.settings.uploadRemove,
          drop: t.settings.uploadDrop,
          uploading: t.settings.uploadUploading,
          errorType: t.settings.uploadErrorType,
          errorSize: t.settings.uploadErrorSize,
          errorUpload: t.settings.uploadErrorUpload,
        }}
      />

      <div>
        <p className="text-[0.8125rem] font-medium text-body">
          {t.dashboard.products.statusLabel}
        </p>
        <input type="hidden" name="status" value={status} />

        <div className="mt-2 inline-flex rounded-full border border-border bg-bg-soft p-1">
          {(["draft", "published"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={status === option}
              onClick={() => setStatus(option)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-colors",
                status === option
                  ? "bg-surface text-fg shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  : "text-subtle hover:text-fg",
              )}
            >
              {option === "draft"
                ? t.dashboard.products.statusDraft
                : t.dashboard.products.statusPublished}
            </button>
          ))}
        </div>
      </div>

      {state.status === "unconfigured" ? (
        <FormNotice>{errors.notConfigured}</FormNotice>
      ) : null}

      {message ? <FormNotice tone="error">{message}</FormNotice> : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ size: "lg" })}
        >
          {pending ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
              {t.dashboard.products.submit}
            </>
          )}
        </button>

        <ButtonLink
          href={path(locale, "/app/products")}
          variant="outline"
          size="lg"
        >
          {t.dashboard.products.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
