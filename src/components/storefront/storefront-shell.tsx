import type { ReactNode } from "react";

/** Coquille de la vitrine : fond du thème, largeur de lecture, pied de page. */
export function StorefrontShell({
  children,
  footerLabel,
}: {
  children: ReactNode;
  footerLabel: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pt-4 sm:px-8">
        {children}
      </div>
      <StorefrontFooter label={footerLabel} />
    </div>
  );
}

/** Mention discrète, présente sur toutes les vitrines. */
export function StorefrontFooter({ label }: { label: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-5 py-6 sm:px-8">
        <a
          href="https://pashove.com"
          className="text-[0.75rem] text-faint transition-colors hover:text-muted"
        >
          {label}
        </a>
      </div>
    </footer>
  );
}
