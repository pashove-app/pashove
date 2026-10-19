import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Carte de plan, en bas de la navigation.
 *
 * Aucun bouton : la facturation n'existe pas encore, et un « S'abonner » qui
 * ne mène nulle part serait frustrant. Le texte dit ce qu'il y a à savoir.
 */
export function SidebarPlanCard({
  t,
  collapsed = false,
}: {
  t: Dictionary;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div
        title={`${t.dashboard.sidebar.planTitle} · ${t.dashboard.sidebar.planText}`}
        className="flex justify-center py-1"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70">
          <Icon path={icons.bolt} className="h-4 w-4" strokeWidth={1.8} />
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
      <p className="text-[0.75rem] font-medium text-white">
        {t.dashboard.sidebar.planTitle}
      </p>
      <p className="mt-0.5 text-[0.6875rem] text-white/50">
        {t.dashboard.sidebar.planText}
      </p>
    </div>
  );
}
