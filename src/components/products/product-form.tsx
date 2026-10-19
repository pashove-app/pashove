"use client";

import { useActionState, useState } from "react";
import { FileUploader, type FileValue } from "@/components/media/file-uploader";
import { MediaGalleryField, type GalleryItem } from "@/components/products/media-gallery-field";
import { ShippingCountriesField } from "@/components/products/shipping-countries-field";
import { VariantsField, type VariantRow } from "@/components/products/variants-field";
import { FormNotice, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { buttonClass, ButtonLink, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { useFieldErrors } from "@/lib/forms/use-field-errors";
import { createProductAction, updateProductAction } from "@/lib/products/actions";
import type { Product } from "@/lib/products/queries";
import {
  formatPriceInput,
  type ProductOption,
  type ProductType,
} from "@/lib/products/schema";
import { INITIAL_PRODUCT_FORM_STATE } from "@/lib/products/types";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/cn";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240] as const;

type DurationKey = keyof Dictionary["dashboard"]["products"]["durations"];

const DURATION_KEYS: Record<number, DurationKey> = {
  15: "m15",
  30: "m30",
  45: "m45",
  60: "m60",
  90: "m90",
  120: "m120",
  180: "m180",
  240: "m240",
};

/**
 * Formulaire de produit, partagé par les trois types.
 *
 * Seule la section du milieu change : chaque type n'affiche que ses champs, et
 * la Server Action valide exactement ceux-là. Le type vient de la route.
 */
export function ProductForm({
  t,
  locale,
  mode,
  type,
  currency,
  storeSlug,
  product,
  initialImages,
  initialFile,
}: {
  t: Dictionary;
  locale: Locale;
  mode: "create" | "edit";
  type: ProductType;
  currency: string;
  storeSlug: string;
  product?: Product;
  initialImages: GalleryItem[];
  initialFile: FileValue;
}) {
  const isEdit = mode === "edit";

  const [state, formAction, pending] = useActionState(
    isEdit ? updateProductAction : createProductAction,
    INITIAL_PRODUCT_FORM_STATE,
  );

  const { corrected, clear } = useFieldErrors(state);

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(
    product ? formatPriceInput(product.price_amount, currency) : "",
  );
  const [options, setOptions] = useState<ProductOption[]>(product?.options ?? []);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [status, setStatus] = useState<"draft" | "published">(
    product?.status ?? "draft",
  );
  const [location, setLocation] = useState<"online" | "in_person">(
    product?.service_location ?? "online",
  );

  const initialVariants: VariantRow[] = (product?.variants ?? []).map((variant) => ({
    values: options.map((option) => variant.option_values[option.name] ?? ""),
    price:
      variant.price_amount === product?.price_amount
        ? null
        : formatPriceInput(variant.price_amount, currency),
    stock: String(variant.stock_quantity),
    sku: variant.sku ?? "",
    barcode: variant.barcode ?? "",
  }));

  const labels = t.dashboard.products;
  const errors = labels.errors as Record<string, string>;
  const fieldError = (key: string) => {
    if (corrected[key]) return undefined;
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const message = state.messageKey ? errors[state.messageKey] : undefined;

  return (
    <form action={formAction} noValidate className="mt-8 space-y-7">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productType" value={type} />
      {isEdit ? <input type="hidden" name="productId" value={product?.id} /> : null}

      <TextField
        name="name"
        label={labels.nameLabel}
        hint={labels.nameHint}
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
        label={labels.slugLabel}
        dir="ltr"
        maxLength={60}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={slug}
        error={fieldError("slug")}
        help={labels.slugHelp}
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
        label={labels.descriptionLabel}
        help={labels.descriptionHelp}
        rows={5}
        maxLength={5000}
        defaultValue={product?.description ?? ""}
        error={fieldError("description")}
        onChange={() => clear("description")}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="price"
          label={labels.priceLabel}
          help={labels.priceHelp.replace("{currency}", currency)}
          icon="wallet"
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          error={fieldError("price")}
          onChange={(event) => {
            clear("price");
            setPrice(event.target.value);
          }}
        />

        <TextField
          name="compareAtPrice"
          label={labels.compareAtLabel}
          help={labels.compareAtHelp}
          icon="percent"
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={
            product?.compare_at_amount
              ? formatPriceInput(product.compare_at_amount, currency)
              : undefined
          }
          error={fieldError("compareAtPrice")}
          onChange={() => clear("compareAtPrice")}
        />
      </div>

      <TextField
        name="tags"
        label={labels.tagsLabel}
        hint={labels.tagsHint}
        help={labels.tagsHelp}
        defaultValue={(product?.tags ?? []).join(", ")}
        error={fieldError("tags")}
        onChange={() => clear("tags")}
      />

      <TextField
        name="videoUrl"
        label={labels.videoLabel}
        help={labels.videoHelp}
        dir="ltr"
        placeholder="https://…"
        defaultValue={product?.video_url ?? ""}
        error={fieldError("videoUrl")}
        onChange={() => clear("videoUrl")}
      />

      <div>
        <MediaGalleryField
          name="imageIds"
          label={labels.imageLabel}
          help={labels.imageHelp}
          initial={initialImages}
          labels={{
            add: labels.galleryAdd,
            remove: t.settings.uploadRemove,
            makePrimary: labels.galleryMakePrimary,
            primary: labels.galleryPrimary,
            uploading: t.settings.uploadUploading,
            errorType: t.settings.uploadErrorType,
            errorSize: t.settings.uploadErrorSize,
            errorUpload: t.settings.uploadErrorUpload,
          }}
        />
        {fieldError("imageIds") ? (
          <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
            {fieldError("imageIds")}
          </p>
        ) : null}
      </div>

      {type === "physical" ? (
        <div className="space-y-6">
          <VariantsField
            t={t}
            options={options}
            onOptionsChange={setOptions}
            initialRows={initialVariants}
            productPrice={price}
            error={fieldError("optionsJson") ?? fieldError("variantsJson")}
          />

          {options.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                name="stock"
                label={labels.stockLabel}
                help={labels.stockHelp}
                dir="ltr"
                inputMode="numeric"
                defaultValue={
                  product?.stock_quantity === null || product?.stock_quantity === undefined
                    ? undefined
                    : String(product.stock_quantity)
                }
                error={fieldError("stock")}
                onChange={() => clear("stock")}
              />

              <TextField
                name="weight"
                label={labels.weightLabel}
                help={labels.weightHelp}
                dir="ltr"
                inputMode="numeric"
                defaultValue={
                  product?.weight_grams === null || product?.weight_grams === undefined
                    ? undefined
                    : String(product.weight_grams)
                }
                error={fieldError("weight")}
                onChange={() => clear("weight")}
              />
            </div>
          ) : (
            <TextField
              name="weight"
              label={labels.weightLabel}
              help={labels.weightHelp}
              dir="ltr"
              inputMode="numeric"
              defaultValue={
                product?.weight_grams === null || product?.weight_grams === undefined
                  ? undefined
                  : String(product.weight_grams)
              }
              error={fieldError("weight")}
              onChange={() => clear("weight")}
            />
          )}

          <div>
            <p className="text-[0.8125rem] font-medium text-body">
              {labels.dimensionsLabel}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-subtle">
              {labels.dimensionsHelp}
            </p>

            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <TextField
                name="length"
                label={labels.lengthLabel}
                dir="ltr"
                inputMode="numeric"
                defaultValue={
                  product?.length_mm === null || product?.length_mm === undefined
                    ? undefined
                    : String(product.length_mm)
                }
                error={fieldError("length")}
                onChange={() => clear("length")}
              />
              <TextField
                name="width"
                label={labels.widthLabel}
                dir="ltr"
                inputMode="numeric"
                defaultValue={
                  product?.width_mm === null || product?.width_mm === undefined
                    ? undefined
                    : String(product.width_mm)
                }
                error={fieldError("width")}
                onChange={() => clear("width")}
              />
              <TextField
                name="height"
                label={labels.heightLabel}
                dir="ltr"
                inputMode="numeric"
                defaultValue={
                  product?.height_mm === null || product?.height_mm === undefined
                    ? undefined
                    : String(product.height_mm)
                }
                error={fieldError("height")}
                onChange={() => clear("height")}
              />
            </div>
          </div>

          <ShippingCountriesField
            t={t}
            label={labels.countriesLabel}
            help={labels.countriesHelp}
            allLabel={labels.countriesAll}
            initial={product?.shipping_countries ?? []}
            error={fieldError("shippingCountries")}
          />
        </div>
      ) : null}

      {type === "digital" ? (
        <div>
          <FileUploader
            name="digitalFileId"
            label={labels.fileLabel}
            help={labels.fileHelp}
            initial={initialFile}
            labels={{
              choose: labels.fileChoose,
              replace: labels.fileReplace,
              remove: labels.fileRemove,
              uploading: labels.fileUploading,
              errorType: labels.fileErrorType,
              errorSize: labels.fileErrorSize,
              errorUpload: labels.fileErrorUpload,
              errorStorage: labels.fileErrorStorage,
              errorForbidden: labels.fileErrorForbidden,
              errorCors: labels.fileErrorCors,
              errorNotFound: labels.fileErrorNotFound,
              errorSession: labels.fileErrorSession,
              errorComplete: labels.fileErrorComplete,
            }}
          />
          {fieldError("fileId") ? (
            <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
              {fieldError("fileId")}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "service" ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            name="duration"
            label={labels.durationLabel}
            defaultValue={String(product?.duration_minutes ?? 60)}
            error={fieldError("duration")}
            onChange={() => clear("duration")}
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {labels.durations[DURATION_KEYS[minutes]]}
              </option>
            ))}
          </SelectField>

          <div>
            <p className="text-[0.8125rem] font-medium text-body">
              {labels.locationLabel}
            </p>
            <input type="hidden" name="serviceLocation" value={location} />
            <div className="mt-2 inline-flex rounded-full border border-border bg-bg-soft p-1">
              {(["online", "in_person"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={location === option}
                  onClick={() => {
                    setLocation(option);
                    clear("location");
                  }}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-colors",
                    location === option
                      ? "bg-surface text-fg shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                      : "text-subtle hover:text-fg",
                  )}
                >
                  {option === "online"
                    ? labels.locationOnline
                    : labels.locationInPerson}
                </button>
              ))}
            </div>
            {fieldError("location") ? (
              <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
                {fieldError("location")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[0.8125rem] font-medium text-body">
          {labels.statusLabel}
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
              {option === "draft" ? labels.statusDraft : labels.statusPublished}
            </button>
          ))}
        </div>
      </div>

      {state.status === "unconfigured" ? (
        <FormNotice>{errors.notConfigured}</FormNotice>
      ) : null}

      {message ? <FormNotice tone="error">{message}</FormNotice> : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
          {pending ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
              {isEdit ? labels.save : labels.submit}
            </>
          )}
        </button>

        <ButtonLink href={path(locale, "/app/products")} variant="outline" size="lg">
          {labels.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
