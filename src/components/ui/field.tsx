"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 *  Enveloppe commune : libellé, champ, aide, erreur
 * ------------------------------------------------------------------ */

const CONTROL = [
  "h-12 w-full rounded-xl border bg-surface text-[0.9375rem] text-fg",
  "placeholder:text-faint",
  "transition-[border-color,box-shadow] duration-200",
  "focus:outline-none focus:ring-4",
  "disabled:opacity-60",
].join(" ");

const CONTROL_OK =
  "border-border hover:border-border-strong focus:border-brand-500 focus:ring-brand-500/12";
const CONTROL_ERROR =
  "border-red-500/60 focus:border-red-500 focus:ring-red-500/12";

function Shell({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-body">
        {label}
      </label>

      <div className="mt-2">{children}</div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[0.75rem] text-red-500 dark:text-red-400"
        >
          <span
            aria-hidden="true"
            className="mt-[0.3rem] block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          />
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="mt-2 text-[0.75rem] text-subtle">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Icône posée à l'intérieur du champ, toujours du côté du début de ligne. */
function LeadingIcon({ name, invalid }: { name: IconKey; invalid?: boolean }) {
  return (
    <Icon
      path={icons[name]}
      className={cn(
        "pointer-events-none absolute start-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2",
        invalid ? "text-red-500/70" : "text-faint",
      )}
      strokeWidth={1.7}
    />
  );
}

/* ------------------------------------------------------------------ *
 *  Champs
 * ------------------------------------------------------------------ */

type BaseProps = {
  label: string;
  hint?: string;
  help?: string;
  error?: string;
  icon?: IconKey;
  className?: string;
};

export function TextField({
  label,
  hint,
  help,
  error,
  icon,
  className,
  ...input
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();

  return (
    <Shell id={id} label={label} help={help} error={error}>
      <div className="relative">
        {icon ? <LeadingIcon name={icon} invalid={Boolean(error)} /> : null}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
          {...input}
          placeholder={hint}
          className={cn(CONTROL, error ? CONTROL_ERROR : CONTROL_OK, icon && "ps-11", "pe-4", className)}
        />
      </div>
    </Shell>
  );
}

export function PasswordField({
  label,
  hint,
  help,
  error,
  revealLabel,
  concealLabel,
  className,
  ...input
}: BaseProps & { revealLabel: string; concealLabel: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <Shell id={id} label={label} help={help} error={error}>
      <div className="relative">
        <LeadingIcon name="lock" invalid={Boolean(error)} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
          {...input}
          placeholder={hint}
          className={cn(CONTROL, error ? CONTROL_ERROR : CONTROL_OK, "ps-11 pe-12", className)}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? concealLabel : revealLabel}
          aria-pressed={visible}
          className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-body"
        >
          <Icon path={visible ? icons.eyeOff : icons.eye} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
        </button>
      </div>
    </Shell>
  );
}

export function SelectField({
  label,
  help,
  error,
  icon,
  className,
  children,
  ...select
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();

  return (
    <Shell id={id} label={label} help={help} error={error}>
      <div className="relative">
        {icon ? <LeadingIcon name={icon} invalid={Boolean(error)} /> : null}
        <select
          id={id}
          aria-invalid={Boolean(error)}
          {...select}
          className={cn(
            CONTROL,
            error ? CONTROL_ERROR : CONTROL_OK,
            icon && "ps-11",
            "pe-10 appearance-none",
            className,
          )}
        >
          {children}
        </select>
        <Icon
          path={icons.chevronDown}
          className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          strokeWidth={2}
        />
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 *  Case à cocher
 * ------------------------------------------------------------------ */

export function Checkbox({
  label,
  error,
  ...input
}: { label: ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
          className={cn(
            "mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 appearance-none rounded-[0.3rem] border bg-surface",
            "transition-colors duration-200 checked:border-brand-500 checked:bg-brand-500",
            "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223.4%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m5 12.5 5 5 9-10%22/></svg>')] checked:bg-center checked:bg-no-repeat",
            "focus:outline-none focus:ring-4 focus:ring-brand-500/15",
            error ? "border-red-500/70" : "border-border-strong",
          )}
        />
        <label htmlFor={id} className="text-[0.8125rem] leading-relaxed text-muted">
          {label}
        </label>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[0.75rem] text-red-500 dark:text-red-400"
        >
          <span
            aria-hidden="true"
            className="mt-[0.3rem] block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Bandeau d'information
 * ------------------------------------------------------------------ */

export function FormNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3.5 text-[0.8125rem] leading-relaxed",
        tone === "error"
          ? "border-red-500/25 bg-red-500/[0.07] text-red-600 dark:text-red-300"
          : "border-brand-500/25 bg-brand-500/[0.07] text-body",
      )}
    >
      <Icon
        path={icons.shield}
        className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "error" ? "text-red-500" : "text-accent")}
      />
      {children}
    </p>
  );
}
