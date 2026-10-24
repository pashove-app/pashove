import { z } from "zod";
import {
  PAYOUT_COUNTRIES,
  isProviderAllowed,
  type PayoutCountry,
} from "@/lib/finance/providers";

const country = z.enum(PAYOUT_COUNTRIES as [PayoutCountry, ...PayoutCountry[]], {
  message: "payoutCountryInvalid",
});

const provider = z.enum(
  ["orange", "wave", "mtn", "moov", "free", "togo"] as const,
  { message: "payoutProviderInvalid" },
);

/** Le numéro est facultatif en édition : un champ vide conserve l'ancien. */
export function payoutMethodSchema(requireNumber: boolean) {
  return z
    .object({
      country,
      provider,
      accountName: z
        .string()
        .trim()
        .min(2, "payoutAccountNameInvalid")
        .max(120, "payoutAccountNameInvalid"),
      accountNumber: z.string().trim().max(30, "payoutNumberInvalid"),
      isDefault: z.boolean(),
    })
    .superRefine((value, context) => {
      if (
        value.accountNumber.length > 0 &&
        !/^\+?[0-9\s().-]+$/.test(value.accountNumber)
      ) {
        context.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "payoutNumberInvalid",
        });
      }

      if (requireNumber && value.accountNumber.replace(/\D/g, "").length === 0) {
        context.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "payoutNumberInvalid",
        });
      }

      const digits = value.accountNumber.replace(/\D/g, "");
      if (digits.length > 0 && (digits.length < 6 || digits.length > 15)) {
        context.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "payoutNumberInvalid",
        });
      }

      if (!isProviderAllowed(value.country, value.provider)) {
        context.addIssue({
          code: "custom",
          path: ["provider"],
          message: "payoutProviderInvalid",
        });
      }
    });
}

export type PayoutMethodInput = z.infer<ReturnType<typeof payoutMethodSchema>>;

export const payoutPinSchema = z
  .object({
    currentPassword: z.string().min(1, "currentPasswordRequired"),
    pin: z.string().regex(/^[0-9]{4}$/, "pinInvalidFormat"),
    confirm: z.string().regex(/^[0-9]{4}$/, "pinInvalidFormat"),
  })
  .refine((value) => value.pin === value.confirm, {
    path: ["confirm"],
    message: "pinMismatch",
  });
