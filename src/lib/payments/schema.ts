import { z } from "zod";
import { isPaymentMethod } from "@/lib/payments/types";

export const paymentSchema = z
  .object({
    paymentMethod: z.string().trim(),
    paymentPhone: z.string().trim().max(40).optional().default(""),
    cardNumber: z.string().trim().max(30).optional().default(""),
    cardExpiry: z.string().trim().max(10).optional().default(""),
    cardCvv: z.string().trim().max(4).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (!isPaymentMethod(value.paymentMethod)) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "checkoutPaymentInvalid",
      });
      return;
    }

    if (value.paymentMethod === "orange_money" || value.paymentMethod === "wave") {
      if (value.paymentPhone.replace(/\D/g, "").length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["paymentPhone"],
          message: "checkoutPhoneInvalid",
        });
      }
    }

    if (value.paymentMethod === "card") {
      const digits = value.cardNumber.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) {
        ctx.addIssue({
          code: "custom",
          path: ["cardNumber"],
          message: "checkoutCardInvalid",
        });
      }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(value.cardExpiry)) {
        ctx.addIssue({
          code: "custom",
          path: ["cardExpiry"],
          message: "checkoutCardInvalid",
        });
      }
      if (!/^\d{3,4}$/.test(value.cardCvv)) {
        ctx.addIssue({
          code: "custom",
          path: ["cardCvv"],
          message: "checkoutCardInvalid",
        });
      }
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;
