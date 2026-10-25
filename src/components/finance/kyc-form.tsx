"use client";

import { useActionState, useState } from "react";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner, buttonClass } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { submitKycAction } from "@/lib/kyc/actions";
import {
  INITIAL_KYC_FORM_STATE,
  type KycFormState,
} from "@/lib/kyc/types";
import { KYC_DOCUMENT_TYPES } from "@/lib/kyc/schema";
import { PAYOUT_COUNTRIES } from "@/lib/finance/providers";
import { KycUploadBox } from "@/components/finance/kyc-upload-box";

type FinanceLabelKey = Exclude<
  keyof Dictionary["dashboard"]["finance"],
  "errors"
>;

const DOCUMENT_LABEL: Record<
  (typeof KYC_DOCUMENT_TYPES)[number],
  FinanceLabelKey
> = {
  national_id: "kycDocNationalId",
  passport: "kycDocPassport",
  driver_license: "kycDocLicense",
  residence_permit: "kycDocResidence",
};

export function KycForm({
  t,
  locale,
  defaultCountry,
  rejectionReason,
  needsResubmission,
}: {
  t: Dictionary;
  locale: Locale;
  defaultCountry: string;
  rejectionReason: string | null;
  needsResubmission: boolean;
}) {
  const labels = t.dashboard.finance;

  const [state, formAction, pending] = useActionState<KycFormState, FormData>(
    submitKycAction,
    INITIAL_KYC_FORM_STATE,
  );

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [selfie, setSelfie] = useState("");

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage = state.messageKey
    ? labels.errors[state.messageKey as keyof typeof labels.errors] ?? null
    : null;

  const uploadLabels = {
    add: labels.kycUploadAdd,
    replace: labels.kycUploadReplace,
    remove: labels.kycUploadRemove,
    uploading: labels.uploading,
    errorType: labels.kycUploadErrorType,
    errorSize: labels.kycUploadErrorSize,
    errorUpload: labels.kycUploadErrorUpload,
  };

  return (
    <form
      action={formAction}
      noValidate
      className="mt-6 space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="frontMediaId" value={front} />
      <input type="hidden" name="backMediaId" value={back} />
      <input type="hidden" name="selfieMediaId" value={selfie} />

      {rejectionReason ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/[0.06] p-4">
          <p className="text-[0.8125rem] font-medium text-red-600 dark:text-red-400">
            {needsResubmission ? labels.kycResubmitTitle : labels.kycRejectedTitle}
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
            {rejectionReason}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="legalName"
          label={labels.kycLegalName}
          hint={labels.kycLegalNameHint}
          autoComplete="name"
          error={fieldError("legalName")}
        />

        <TextField
          name="birthDate"
          type="date"
          label={labels.kycBirthDate}
          dir="ltr"
          error={fieldError("birthDate")}
        />

        <SelectField
          name="country"
          label={labels.kycCountry}
          defaultValue={
            PAYOUT_COUNTRIES.includes(defaultCountry as never)
              ? defaultCountry
              : "SN"
          }
          error={fieldError("country")}
        >
          {PAYOUT_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {t.countries_names[code as keyof Dictionary["countries_names"]] ?? code}
            </option>
          ))}
        </SelectField>

        <SelectField
          name="documentType"
          label={labels.kycDocumentType}
          defaultValue="national_id"
          error={fieldError("documentType")}
        >
          {KYC_DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {labels[DOCUMENT_LABEL[type]]}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        name="documentNumber"
        label={labels.kycDocumentNumber}
        hint={labels.kycDocumentNumberHint}
        dir="ltr"
        autoComplete="off"
        error={fieldError("documentNumber")}
        help={labels.kycDocumentNumberHelp}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <KycUploadBox
          label={labels.kycFront}
          help={labels.kycFrontHelp}
          value={front}
          onChange={setFront}
          labels={uploadLabels}
          error={fieldError("frontMediaId")}
        />
        <KycUploadBox
          label={labels.kycBack}
          help={labels.kycBackHelp}
          value={back}
          onChange={setBack}
          labels={uploadLabels}
          error={fieldError("backMediaId")}
        />
      </div>

      <KycUploadBox
        label={labels.kycSelfie}
        help={labels.kycSelfieHelp}
        value={selfie}
        onChange={setSelfie}
        labels={uploadLabels}
        error={fieldError("selfieMediaId")}
      />

      <Checkbox
        name="consent"
        error={fieldError("consent")}
        label={labels.kycConsent}
      />

      {serverMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-500 dark:text-red-400"
        >
          {serverMessage}
        </p>
      ) : null}

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-bg-soft px-4 py-3.5">
        <Icon path={icons.lock} className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <p className="text-[0.75rem] leading-relaxed text-subtle">
          {labels.kycPrivacy}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={buttonClass({ variant: "primary" })}
      >
        {pending ? <Spinner /> : null}
        {pending ? labels.saving : labels.kycSubmit}
      </button>
    </form>
  );
}
