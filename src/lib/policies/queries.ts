import { createClient } from "@/lib/supabase/server";
import { POLICY_PAGES, type PolicySlug } from "@/lib/policies/pages";

export type LegalIdentity = {
  legal_name: string | null;
  legal_form: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
  tax_number: string | null;
};

export type StorePolicyPage = {
  slug: PolicySlug;
  body: string;
  is_published: boolean;
  updated_at: string | null;
};

export type StorePolicies = {
  identity: LegalIdentity;
  pages: StorePolicyPage[];
};

const EMPTY_IDENTITY: LegalIdentity = {
  legal_name: null,
  legal_form: null,
  address: null,
  city: null,
  country: null,
  email: null,
  phone: null,
  registration_number: null,
  tax_number: null,
};

export async function getStorePolicies(storeId: string): Promise<StorePolicies> {
  const supabase = await createClient();

  const [identity, pages] = await Promise.all([
    supabase
      .from("store_legal_identity")
      .select(
        "legal_name, legal_form, address, city, country, email, phone, registration_number, tax_number",
      )
      .eq("store_id", storeId)
      .maybeSingle(),
    supabase
      .from("store_pages")
      .select("slug, body, is_published, updated_at")
      .eq("store_id", storeId),
  ]);

  const bySlug = new Map(
    ((pages.data ?? []) as unknown as StorePolicyPage[]).map((page) => [
      page.slug,
      page,
    ]),
  );

  return {
    identity: (identity.data as unknown as LegalIdentity | null) ?? EMPTY_IDENTITY,
    pages: POLICY_PAGES.map((definition) => {
      const page = bySlug.get(definition.slug);
      return {
        slug: definition.slug,
        body: page?.body ?? "",
        is_published: page?.is_published ?? false,
        updated_at: page?.updated_at ?? null,
      } satisfies StorePolicyPage;
    }),
  };
}

export async function listPublishedPolicySlugs(
  storeId: string,
): Promise<PolicySlug[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_pages")
    .select("slug")
    .eq("store_id", storeId)
    .eq("is_published", true);

  return ((data ?? []) as { slug: PolicySlug }[]).map((row) => row.slug);
}

export async function getPublishedPolicyPage(
  storeId: string,
  slug: PolicySlug,
): Promise<StorePolicyPage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_pages")
    .select("slug, body, is_published, updated_at")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  return (data as unknown as StorePolicyPage | null) ?? null;
}
