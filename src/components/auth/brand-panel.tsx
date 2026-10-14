import { PashoveLogo } from "@/components/brand/pashove-logo";
import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Volet gauche des pages d'authentification.
 *
 * Toujours sombre, quel que soit le thème : c'est la « fenêtre » de la marque,
 * posée à côté du formulaire clair. Contient le logo, l'accroche, et une carte
 * bas de page.
 *
 * Cette carte liste des faits vérifiables (pays, moyens de paiement, versement
 * direct) et non un témoignage : nous n'avons pas encore de clients à citer.
 */
export function AuthBrandPanel({ t }: { t: Dictionary }) {
  return (
    <aside className="relative hidden p-3 lg:block">
      <div className="panel-deep grain sticky top-3 flex h-[calc(100dvh-1.5rem)] flex-col justify-between overflow-hidden rounded-3xl p-10 xl:p-12">
        <div className="orbit-rings opacity-50" />

        <div className="relative">
          <PashoveLogo className="text-white" />

          {/* `flex w-fit` et non `inline-flex` : un élément en ligne ne prendrait
              pas la marge haute et viendrait se coller au logo. */}
          <div className="mt-10 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.auth.badge}
          </div>

          {/* Dernière proposition en italique, comme sur la référence */}
          <h1 className="text-display mt-6 max-w-lg text-[2.15rem] text-white xl:text-[2.6rem]">
            {t.auth.panelTitleA}{" "}
            <em className="italic text-brand-300">{t.auth.panelTitleB}</em>
          </h1>

          <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-white/60">
            {t.auth.panelText}
          </p>
        </div>

        <div className="relative mt-10 rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-md">
          <p className="text-[0.875rem] font-medium text-white">{t.auth.trustTitle}</p>
          <ul className="mt-3.5 space-y-2.5">
            {t.auth.trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[0.8125rem] text-white/70">
                <Icon
                  path={icons.check}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
                  strokeWidth={3}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
