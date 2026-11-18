import { createPublicClient } from "@/lib/supabase/public";

export type PublicTestimonial = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  avatarUrl: string | null;
};

/** Témoignages publiés par l'équipe plateforme. Table vide = section honnête. */
export async function listPublicTestimonials(): Promise<PublicTestimonial[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id, name, role, quote, rating, avatar_url")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(9);

  return ((data ?? []) as {
    id: string;
    name: string;
    role: string | null;
    quote: string;
    rating: number;
    avatar_url: string | null;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    rating: row.rating,
    avatarUrl: row.avatar_url,
  }));
}
