import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "checkoutNameInvalid").max(120, "checkoutNameInvalid"),
  email: z.string().trim().email("checkoutEmailInvalid").max(254, "checkoutEmailInvalid"),
  phone: z.string().trim().min(6, "checkoutPhoneInvalid").max(40, "checkoutPhoneInvalid"),
  country: z.string().trim().length(2, "checkoutCountryInvalid").transform((v) => v.toUpperCase()),
  city: z.string().trim().min(2, "checkoutCityInvalid").max(100, "checkoutCityInvalid"),
  address: z.string().trim().min(5, "checkoutAddressInvalid").max(200, "checkoutAddressInvalid"),
  extra: z.string().trim().max(200, "checkoutAddressInvalid"),
  notes: z.string().trim().max(500, "checkoutNotesTooLong"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
