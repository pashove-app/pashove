import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KYC_DOCUMENT_TYPES = [
  "national_id",
  "passport",
  "driver_license",
  "residence_permit",
] as const;

export const kycSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "kycNameInvalid")
    .max(160, "kycNameInvalid"),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "kycBirthDateInvalid"),
  country: z
    .string()
    .trim()
    .length(2, "kycCountryInvalid")
    .transform((value) => value.toUpperCase()),
  documentType: z.enum(KYC_DOCUMENT_TYPES, {
    message: "kycDocumentInvalid",
  }),
  documentNumber: z
    .string()
    .trim()
    .min(4, "kycDocumentInvalid")
    .max(40, "kycDocumentInvalid")
    .regex(/^[A-Za-z0-9\s-]+$/, "kycDocumentInvalid"),
  frontMediaId: z.string().regex(UUID_PATTERN, "kycDocumentsRequired"),
  backMediaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "kycDocumentsRequired",
    ),
  selfieMediaId: z.string().regex(UUID_PATTERN, "kycDocumentsRequired"),
  consent: z.literal(true, { message: "kycConsentRequired" }),
});

export type KycInput = z.infer<typeof kycSchema>;

/** Les quatre derniers caractères alphanumériques du document. */
export function documentLast4(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase();
}
