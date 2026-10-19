"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { deleteProductAction } from "@/lib/products/actions";

/**
 * Suppression en deux temps, sans boîte de dialogue native.
 *
 * La confirmation remplace le bouton dans la ligne : un clic de plus, et la
 * Server Action supprime le produit, ses variantes et ses médias.
 */
export function DeleteProductButton({
  locale,
  productId,
  labels,
}: {
  locale: string;
  productId: string;
  labels: {
    delete: string;
    deleteConfirm: string;
    deleteYes: string;
    deleteNo: string;
  };
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={labels.delete}
        title={labels.delete}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <Icon path={icons.trash} className="h-4 w-4" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <form
      action={deleteProductAction}
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />

      <span className="text-[0.6875rem] font-medium text-red-500">
        {labels.deleteConfirm}
      </span>

      <button
        type="submit"
        className="rounded-md bg-red-500/10 px-2 py-1 text-[0.6875rem] font-semibold text-red-500 transition-colors hover:bg-red-500/15"
      >
        {labels.deleteYes}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-1 text-[0.6875rem] font-medium text-subtle transition-colors hover:text-fg"
      >
        {labels.deleteNo}
      </button>
    </form>
  );
}
