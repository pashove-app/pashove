"use client";

import { useActionState, type ReactNode } from "react";
import { MediaUploader, type MediaValue } from "@/components/media/media-uploader";
import { Checkbox, FormNotice, TextAreaField, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import { useFieldErrors } from "@/lib/forms/use-field-errors";
import { saveStoreSettingsAction } from "@/lib/stores/actions";
import type { Store } from "@/lib/stores/queries";
import { INITIAL_STORE_SETTINGS_STATE } from "@/lib/stores/types";
import { formatPriceInput } from "@/lib/products/schema";

/**
 * Réglages de la vitrine.
 *
 * Un seul formulaire, une seule sauvegarde : le marchand remplit ce qu'il
 * veut, laisse le reste vide, et n'a pas à valider trois fois de suite.
 * Les adresses d'image sont collées à la main tant que l'import de fichiers
 * n'est pas branché.
 */
export function StoreSettingsForm({
  t,
  locale,
  store,
  logoMedia,
  bannerMedia,
}: SectionProps & {
  store: Store;
  logoMedia: MediaValue;
  bannerMedia: MediaValue;
}) {
  const [state, formAction, pending] = useActionState(
    saveStoreSettingsAction,
    INITIAL_STORE_SETTINGS_STATE,
  );

  const { corrected, clear } = useFieldErrors(state);

  const errors = t.settings.errors as Record<string, string>;
  const fieldError = (key: string) => {
    if (corrected[key]) return undefined;
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const message = state.messageKey ? errors[state.messageKey] : undefined;

  // Les téléverseurs valident côté client ; cette clé couvre le cas où une
  // référence invalide arriverait tout de même au serveur.
  const mediaKey =
    state.fieldErrors?.logoMediaId ?? state.fieldErrors?.bannerMediaId;
  const mediaError = mediaKey ? errors[mediaKey] : undefined;

  const pickupCopy =
    locale === "en"
      ? {
          title: "Pickup point",
          text: "Address shown on the tracking map to locate your store.",
          label: "Store address",
          help: "Street, district, city. We locate it automatically.",
          notLocated:
            "This address could not be located. Tracking will use the courier’s position when the ride starts.",
        }
      : {
          title: "Point de retrait",
          text: "Adresse affichée sur la carte de suivi pour situer ta boutique.",
          label: "Adresse de la boutique",
          help: "Rue, quartier, ville. Nous la localisons automatiquement.",
          notLocated:
            "Cette adresse n’a pas pu être localisée. Le suivi utilisera la position du livreur au démarrage.",
        };

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />

      <Card title={t.settings.presentationTitle} text={t.settings.presentationText}>
        <TextField
          name="heroTitle"
          label={t.settings.heroTitleLabel}
          help={t.settings.heroTitleHelp}
          maxLength={80}
          defaultValue={store.hero_title ?? ""}
          error={fieldError("heroTitle")}
          onChange={() => clear("heroTitle")}
        />

        <TextField
          name="heroSubtitle"
          label={t.settings.heroSubtitleLabel}
          help={t.settings.heroSubtitleHelp}
          maxLength={160}
          defaultValue={store.hero_subtitle ?? ""}
          error={fieldError("heroSubtitle")}
          onChange={() => clear("heroSubtitle")}
        />

        <TextAreaField
          name="description"
          label={t.settings.descriptionLabel}
          rows={4}
          maxLength={500}
          defaultValue={store.description ?? ""}
          error={fieldError("description")}
          onChange={() => clear("description")}
        />
      </Card>

      <Card title={t.settings.contactTitle} text={t.settings.contactText}>
        <TextField
          name="contactEmail"
          type="email"
          label={t.settings.contactEmailLabel}
          icon="mail"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          defaultValue={store.contact_email ?? ""}
          error={fieldError("contactEmail")}
          onChange={() => clear("contactEmail")}
        />

        <TextField
          name="contactPhone"
          type="tel"
          label={t.settings.contactPhoneLabel}
          icon="phone"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={store.contact_phone ?? ""}
          error={fieldError("contactPhone")}
          onChange={() => clear("contactPhone")}
        />
      </Card>

      <Card title={pickupCopy.title} text={pickupCopy.text}>
        <TextField
          name="storeAddress"
          label={pickupCopy.label}
          help={pickupCopy.help}
          autoComplete="street-address"
          maxLength={200}
          defaultValue={store.address ?? ""}
          error={fieldError("storeAddress")}
          onChange={() => clear("storeAddress")}
        />

        {store.address && store.latitude === null ? (
          <p className="text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
            {pickupCopy.notLocated}
          </p>
        ) : null}
      </Card>

      <Card title={t.settings.visualTitle} text={t.settings.visualText}>
        <MediaUploader
          name="logoMediaId"
          kind="logo"
          label={t.settings.logoLabel}
          help={t.settings.logoHelp}
          initial={logoMedia}
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

        <MediaUploader
          name="bannerMediaId"
          kind="banner"
          wide
          label={t.settings.bannerLabel}
          help={t.settings.bannerHelp}
          initial={bannerMedia}
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

        {mediaError ? (
          <p role="alert" className="text-[0.75rem] text-red-500 dark:text-red-400">
            {mediaError}
          </p>
        ) : null}
      </Card>

      <Card title={t.settings.shippingTitle} text={t.settings.shippingText}>
        <TextField
          name="shippingFlat"
          label={t.settings.shippingFlatLabel}
          help={t.settings.shippingFlatHelp.replace("{currency}", store.currency)}
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={formatPriceInput(store.shipping_flat_amount, store.currency)}
          error={fieldError("shippingFlat")}
          onChange={() => clear("shippingFlat")}
        />

        <div>
          <Checkbox
            name="codEnabled"
            defaultChecked={store.cod_enabled}
            label={t.settings.codLabel}
          />
          <p className="mt-1 ps-8 text-[0.75rem] leading-relaxed text-subtle">
            {t.settings.codHelp}
          </p>
        </div>
      </Card>

      {state.status === "unconfigured" ? (
        <FormNotice>{errors.notConfigured}</FormNotice>
      ) : null}

      {message ? <FormNotice tone="error">{message}</FormNotice> : null}

      {state.status === "saved" ? (
        <p
          role="status"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
          {t.settings.saved}
        </p>
      ) : null}

      <div className="mt-8">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
        >
          {pending ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.2} />
              {t.settings.save}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/** Carte de réglages — même forme que les cartes de la page sécurité. */
function Card({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[0.9375rem] font-medium text-fg">{title}</h2>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">{text}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
