"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SectionRenderer } from "@/components/theme-renderer/sections";
import {
  marketMatches,
  sectionHidden,
  themeVars,
} from "@/components/theme-renderer/style";
import type {
  ThemeDocument,
  ThemeSectionInstance,
} from "@/lib/theme-editor/types";
import type { ThemeRenderContext, ThemeRenderFlags } from "@/components/theme-renderer/context";

function passesAudience(section: ThemeSectionInstance, flags: ThemeRenderFlags): boolean {
  const loggedIn = flags.loggedIn === true;
  if (loggedIn && section.settings.showLoggedIn === false) return false;
  if (!loggedIn && section.settings.showGuest === false) return false;
  return true;
}

function RevealWrapper({
  section,
  children,
  editable,
}: {
  section: ThemeSectionInstance;
  children: ReactNode;
  editable?: boolean;
}) {
  const enabled =
    !editable && section.settings.animateOnScroll === true;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const element = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  const animation = String(section.settings.animationType ?? "fade");
  const delay = Number(section.settings.animationDelay ?? 0);
  const duration = Number(section.settings.animationDuration ?? 500);

  const hidden: CSSProperties =
    animation === "slide"
      ? { opacity: 0, transform: "translateY(22px)" }
      : animation === "zoom"
        ? { opacity: 0, transform: "scale(0.97)" }
        : { opacity: 0 };

  return (
    <div
      ref={ref}
      style={{
        ...(visible ? { opacity: 1, transform: "none" } : hidden),
        transition: `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function ThemeDocumentRenderer({
  document,
  context,
  templateId,
  flags = {},
}: {
  document: ThemeDocument;
  context: ThemeRenderContext;
  templateId: string;
  flags?: ThemeRenderFlags;
}) {
  const settings = document.settings;
  const device = flags.device ?? "desktop";
  const template =
    document.templates.find((entry) => entry.id === templateId) ??
    document.templates.find((entry) => entry.type === templateId) ??
    document.templates.find((entry) => entry.type === "index") ??
    document.templates[0];

  const visible = (sections: ThemeSectionInstance[]) =>
    sections.filter(
      (section) =>
        !sectionHidden(section, device) &&
        marketMatches(section, flags.market) &&
        passesAudience(section, flags),
    );

  const style: CSSProperties = {
    ...themeVars(settings),
    minHeight: "100%",
  };

  return (
    <div style={style} data-theme-document={templateId}>
      {settings.customCss ? <style>{settings.customCss}</style> : null}

      {flags.showChrome !== false ? (
        <div data-chrome="header">
          {visible(document.header).map((section) => (
            <RevealWrapper key={section.id} section={section} editable={flags.editable}>
              <SectionRenderer section={section} settings={settings} context={context} flags={flags} />
            </RevealWrapper>
          ))}
        </div>
      ) : null}

      <main>
        {visible(template?.sections ?? []).map((section) => (
          <div key={section.id} className="relative" data-theme-section={section.id}>
            <RevealWrapper section={section} editable={flags.editable}>
              <SectionRenderer section={section} settings={settings} context={context} flags={flags} />
            </RevealWrapper>
            {flags.editable && flags.onAddSection ? (
              <button
                type="button"
                aria-label="Ajouter une section ici"
                onClick={() => flags.onAddSection?.(section.id)}
                className="absolute bottom-0 left-1/2 z-30 flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#2F5CFF] text-[15px] font-bold leading-none text-white shadow-lg"
              >
                +
              </button>
            ) : null}
          </div>
        ))}
      </main>

      {flags.showChrome !== false ? (
        <footer data-chrome="footer" style={{ borderTop: "1px solid var(--t-border)" }}>
          {visible(document.footer).map((section) => (
            <RevealWrapper key={section.id} section={section} editable={flags.editable}>
              <SectionRenderer section={section} settings={settings} context={context} flags={flags} />
            </RevealWrapper>
          ))}
        </footer>
      ) : null}

      {context.appEmbeds && context.appEmbeds.length > 0 ? (
        <div data-app-embeds aria-hidden={flags.editable ? "true" : undefined}>
          {context.appEmbeds.map((embed) => (
            <div key={embed.appId} className="fixed bottom-4 left-4 z-[60] rounded-full bg-black/80 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {embed.name}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
