/**
 * Déduit un identifiant lisible d'un nom.
 *
 * Les accents sont dépliés (`Maison Kora` → `maison-kora`) plutôt que
 * remplacés : un identifiant reste une adresse, elle doit se dicter au
 * téléphone sans hésitation.
 */
export function slugify(value: string, maxLength = 60): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, maxLength)
    .replace(/-+$/, "");
}
