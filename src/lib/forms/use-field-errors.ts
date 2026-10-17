import { useState } from "react";

type StateWithErrors = { fieldErrors?: Record<string, string> };

/**
 * Suit les champs corrigés depuis la dernière soumission.
 *
 * Une erreur de validation décrit une valeur qui n'existe plus dès que le
 * marchand tape : la laisser affichée sous un champ désormais valide donne
 * l'impression que le formulaire refuse ce qu'il vient d'accepter.
 *
 * Les corrections sont rattachées à l'état qui les a produites (`source`) :
 * dès qu'une nouvelle soumission renvoie un état différent, elles cessent
 * d'être prises en compte. Aucun effet, donc aucun rendu intermédiaire.
 */
export function useFieldErrors<T extends StateWithErrors>(state: T) {
  const [edits, setEdits] = useState<{
    source: T;
    corrected: Record<string, boolean>;
  }>({ source: state, corrected: {} });

  /** Un champ corrigé ne montre plus l'erreur de la soumission précédente. */
  const corrected = edits.source === state ? edits.corrected : {};

  function clear(key: string) {
    setEdits((current) => {
      const base = current.source === state ? current.corrected : {};
      if (base[key]) return current;
      return { source: state, corrected: { ...base, [key]: true } };
    });
  }

  return { corrected, clear };
}
