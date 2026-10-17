/**
 * Aplats de marque de la vitrine.
 *
 * Le même dégradé que le panneau d'onboarding, pour que la boutique ressemble
 * à Pashove même sans logo ni bannière. Il reste identique dans les deux
 * thèmes : c'est une surface de marque, pas une surface d'interface.
 *
 * Écrits ici en utilitaires arbitraires plutôt que dans `globals.css` :
 * Turbopack a déjà servi un CSS compilé périmé après modification de ce
 * fichier, et ces classes-ci sont extraites du scan des sources.
 */
export const BRAND_GRADIENT =
  "[background:radial-gradient(120%_85%_at_16%_6%,#7f9dff_0%,transparent_52%),radial-gradient(110%_80%_at_100%_100%,#1026a0_0%,transparent_62%),linear-gradient(158deg,#2f5cff_0%,#2447d6_52%,#17339c_100%)]";

export const BRAND_GRID =
  "[background-image:linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(120%_90%_at_50%_40%,#000_35%,transparent_78%)]";
