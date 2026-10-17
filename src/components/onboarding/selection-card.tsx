import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * Carte de sélection, adossée à un vrai bouton radio.
 *
 * Le champ reste un `<input type="radio">` : la sélection fonctionne au clavier,
 * sans JavaScript, et l'état est annoncé par les lecteurs d'écran. Le `peer`
 * de Tailwind fait suivre l'apparence de la carte.
 */
export function SelectionCard({
  name,
  value,
  label,
  hint,
  flag,
  icon,
  type = "radio",
  defaultChecked = false,
  stacked = false,
}: {
  name: string;
  value: string;
  label: string;
  /** Précision secondaire, par exemple le code d'une devise. */
  hint?: string;
  /** Drapeau affiché avant le libellé (pays). */
  flag?: string;
  /** Icône affichée avant le libellé (types de vente). */
  icon?: IconKey;
  /** `checkbox` pour un choix multiple, `radio` pour un choix unique. */
  type?: "radio" | "checkbox";
  defaultChecked?: boolean;
  /** Libellé au-dessus de la précision, au lieu d'être côte à côte. */
  stacked?: boolean;
}) {
  return (
    <label className="relative block h-full">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />

      <span
        className={cn(
          "flex h-full min-h-[3.875rem] cursor-pointer items-center gap-2.5 rounded-2xl border border-border bg-surface py-3 pe-9 ps-3.5",
          "transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-strong",
          "peer-checked:border-brand-500 peer-checked:bg-brand-500/[0.08]",
          "peer-checked:shadow-[inset_0_0_0_1px_var(--color-brand-500)]",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          stacked && "flex-col items-start justify-center gap-0.5 py-3.5",
        )}
      >
        {icon ? (
          <span aria-hidden="true" className={cn("text-accent", stacked && "mb-1")}>
            <Icon path={icons[icon]} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
          </span>
        ) : null}

        {flag ? (
          <span aria-hidden="true" className="text-lg leading-none">
            {flag}
          </span>
        ) : null}

        <span className="min-w-0 text-sm font-medium leading-tight text-body [overflow-wrap:anywhere]">
          {label}
        </span>

        {hint ? (
          <span className="text-[0.6875rem] font-medium tabular-nums tracking-[0.08em] text-faint">
            {hint}
          </span>
        ) : null}
      </span>

      {/* Sœur de l'input, donc atteignable par `peer-checked` — impossible
          depuis l'intérieur de la carte, qui est un simple descendant. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute end-2.5 top-2.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center",
          "rounded-full bg-brand-500 text-white",
          "scale-75 opacity-0 transition-[opacity,transform] duration-200",
          "peer-checked:scale-100 peer-checked:opacity-100",
        )}
      >
        <Icon path={icons.check} className="h-[0.6875rem] w-[0.6875rem]" strokeWidth={3.4} />
      </span>
    </label>
  );
}
