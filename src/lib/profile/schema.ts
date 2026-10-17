import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import { SUPPORTED_COUNTRY_CODES } from "@/lib/site-content";

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

/**
 * Fuseau le plus probable pour un pays.
 *
 * La zone UEMOA vit en GMT, mais un marchand installé au Nigeria ou au Kenya
 * n'a pas la même heure : le pays choisi pré-remplit le fuseau, que le marchand
 * reste libre de corriger.
 */
export const TIMEZONE_BY_COUNTRY: Record<string, Timezone> = {
  SN: "Africa/Dakar",
  CI: "Africa/Abidjan",
  ML: "Africa/Bamako",
  BF: "Africa/Ouagadougou",
  BJ: "Africa/Porto-Novo",
  TG: "Africa/Lome",
  NE: "Africa/Niamey",
  GW: "Africa/Bissau",
  GN: "Africa/Conakry",
  GH: "Africa/Accra",
  NG: "Africa/Lagos",
  CM: "Africa/Douala",
  CG: "Africa/Brazzaville",
  CD: "Africa/Kinshasa",
  GA: "Africa/Libreville",
  TD: "Africa/Ndjamena",
  KE: "Africa/Nairobi",
  RW: "Africa/Kigali",
  TZ: "Africa/Dar_es_Salaam",
  MG: "Indian/Antananarivo",
};

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
  country: z.enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
    message: "countryRequired",
  }),
  timezone: z.enum(TIMEZONES, { message: "timezoneInvalid" }),
  language: z.enum(LOCALES, { message: "languageInvalid" }),
});
