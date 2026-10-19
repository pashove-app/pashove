/**
 * État renvoyé par les Server Actions produit.
 *
 * Le serveur ne renvoie que des **clés** de message, résolues dans le
 * dictionnaire de la langue affichée.
 */
export type ProductFormState = {
  status: "idle" | "invalid" | "error" | "saved" | "unconfigured";
  /** Une clé de message par champ fautif (voir `dashboard.products.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
};

export const INITIAL_PRODUCT_FORM_STATE: ProductFormState = { status: "idle" };
