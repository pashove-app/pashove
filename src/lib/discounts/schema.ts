import { z } from "zod";

export const discountSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "codeInvalid")
    .max(32, "codeInvalid")
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/, "codeInvalid"),
  kind: z.enum(["percent", "fixed"], { message: "kindInvalid" }),
  value: z.string().trim().min(1, "valueInvalid"),
  minSubtotal: z.string().trim(),
  maxUses: z.string().trim(),
  startsAt: z.string().trim(),
  expiresAt: z.string().trim(),
  active: z.string().optional(),
});

export type DiscountInput = z.infer<typeof discountSchema>;

/** "2026-12-31" → ISO ; la fin de journée inclut toute la date choisie. */
export function parseDate(
  raw: string,
  endOfDay: boolean,
): { value: string | null; invalid: boolean } {
  if (!raw) return { value: null, invalid: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { value: null, invalid: true };
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return { value: null, invalid: true };

  if (endOfDay) date.setUTCHours(23, 59, 59, 999);

  return { value: date.toISOString(), invalid: false };
}
