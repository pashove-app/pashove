import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export type NavItem = {
  id?: string;
  label: string;
  href: string;
  visible: boolean;
};

const COLUMNS = "id, label, href, visible, position";

export async function listNavItems(storeId: string): Promise<NavItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_nav_items")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  return (data ?? []) as NavItem[];
}

/** Navigation publique : les liens visibles, dans l'ordre choisi. */
export async function listPublicNav(storeId: string): Promise<NavItem[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("store_nav_items")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("visible", true)
    .order("position", { ascending: true });

  return (data ?? []) as NavItem[];
}

export const navItemSchema = z.object({
  label: z.string().trim().min(1, "navLabelInvalid").max(40, "navLabelInvalid"),
  href: z
    .string()
    .trim()
    .max(300, "navHrefInvalid")
    .refine(
      (value) =>
        value.startsWith("/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "navHrefInvalid",
    ),
  visible: z.boolean().optional().default(true),
});

export const navSchema = z.array(navItemSchema).max(10, "navTooMany");
