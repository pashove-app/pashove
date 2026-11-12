import { listInventoryProducts } from "@/lib/inventory/queries";
import { currentStore } from "@/lib/stores/queries";

export const dynamic = "force-dynamic";

function cell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** Export CSV du stock, une ligne par variante. */
export async function GET() {
  const store = await currentStore();
  if (!store) {
    return new Response("Unauthorized", { status: 401 });
  }

  const products = await listInventoryProducts(store.id);
  const lines = [
    ["Produit", "Variante", "SKU", "Stock", "Seuil", "Etat"]
      .map(cell)
      .join(";"),
  ];

  for (const product of products) {
    const state = product.out
      ? "Rupture"
      : product.low
        ? "Stock faible"
        : "En stock";

    if (product.variants.length === 0) {
      lines.push(
        [
          product.name,
          "",
          "",
          product.stock,
          product.threshold,
          state,
        ]
          .map(cell)
          .join(";"),
      );
      continue;
    }

    for (const variant of product.variants) {
      const variantState =
        variant.stock <= 0
          ? "Rupture"
          : variant.stock <= product.threshold
            ? "Stock faible"
            : "En stock";
      lines.push(
        [
          product.name,
          variant.label,
          variant.sku ?? "",
          variant.stock,
          product.threshold,
          variantState,
        ]
          .map(cell)
          .join(";"),
      );
    }
  }

  const csv = `﻿${lines.join("\r\n")}\r\n`;
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stock-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
