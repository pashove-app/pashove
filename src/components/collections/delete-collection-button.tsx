"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { deleteCollectionAction } from "@/lib/collections/actions";

type Labels = {
  delete: string;
  deleteConfirm: string;
  deleteYes: string;
  deleteNo: string;
};

/**
 * Suppression en deux temps, sans boîte native : le bouton devient une
 * confirmation, et la Server Action supprime la collection et sa couverture.
 */
export function DeleteCollectionButton({
  locale,
  collectionId,
  labels,
}: {
  locale: string;
  collectionId: string;
  labels: Labels;
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
      action={deleteCollectionAction}
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value={collectionId} />

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
