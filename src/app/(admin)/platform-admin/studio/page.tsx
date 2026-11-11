import type { Metadata } from "next";
import { AdminStudioView } from "@/components/studio/admin-studio-view";
import {
  adminStudioOverview,
  adminStudioPricing,
  listStudioMerchants,
} from "@/lib/studio/admin-queries";

export const metadata: Metadata = {
  title: "Pashove · Studio",
  robots: { index: false, follow: false },
};

export default async function AdminStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [overview, pricing, merchants] = await Promise.all([
    adminStudioOverview(),
    adminStudioPricing(),
    listStudioMerchants(),
  ]);

  return (
    <AdminStudioView
      overview={overview}
      pricing={pricing}
      merchants={merchants}
      ok={ok}
      error={error}
    />
  );
}
