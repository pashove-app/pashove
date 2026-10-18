/** « Maison Kora » → « MK ». Une seule initiale si le nom n'a qu'un mot. */
export function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "P";
}
