import { z } from "zod";

/**
 * Règles du profil marchand.
 *
 * La liste des fuseaux est volontairement courte : elle couvre la zone de
 * lancement et ses voisins. Un sélecteur complet (400 entrées) n'aiderait
 * personne ici, et un champ libre laisserait passer des identifiants fautifs
 * que la base accepterait sans broncher.
 */
export const TIMEZONES = [
  "Africa/Abidjan",
  "Africa/Dakar",
  "Africa/Bamako",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Lome",
  "Africa/Niamey",
  "Africa/Bissau",
  "Africa/Conakry",
  "Africa/Accra",
  "Africa/Lagos",
  "Africa/Douala",
  "Africa/Brazzaville",
  "Africa/Kinshasa",
  "Africa/Libreville",
  "Africa/Ndjamena",
  "Africa/Nairobi",
  "Africa/Kigali",
  "Africa/Dar_es_Salaam",
  "Indian/Antananarivo",
  "Europe/Paris",
  "America/New_York",
] as const;

export type Timezone = (typeof TIMEZONES)[number];

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "profileNameRequired")
    .max(120, "profileNameRequired"),
  phone: z
    .string()
    .trim()
    .min(6, "phoneRequired")
    .max(24, "phoneRequired"),
  timezone: z.enum(TIMEZONES, { message: "timezoneInvalid" }),
});
