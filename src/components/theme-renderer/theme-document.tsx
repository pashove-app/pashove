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
  const [viewportDevice, setViewportDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => setViewportDevice(query.matches ? "mobile" : "desktop");
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const device = flags.device ?? viewportDevice;
  const renderFlags: ThemeRenderFlags = { ...flags, device };
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
        passesAudience(section, renderFlags),
    );

  const style: CSSProperties = {
    ...themeVars(settings),
    minHeight: "100%",
    // Les tailles en `cqw` suivent la largeur du cadre d'aperçu (390/768/1440)
    // et, en vitrine, la largeur réelle du document.
    containerType: "inline-size",
  };

  return (
    <div style={style} data-theme-document={templateId}>
      {settings.customCss ? <style>{settings.customCss}</style> : null}

      {flags.showChrome !== false ? (
        <div data-chrome="header">
          {visible(document.header).map((section) => (
            <RevealWrapper key={section.id} section={section} editable={flags.editable}>
              <SectionRenderer section={section} settings={settings} context={context} flags={renderFlags} />
            </RevealWrapper>
          ))}
        </div>
      ) : null}

      <main>
        {(() => {
          const sections = visible(template?.sections ?? []);
          const sectionNode = (section: ThemeSectionInstance) => (
            <div key={section.id} className="relative" data-theme-section={section.id}>
              <RevealWrapper section={section} editable={flags.editable}>
                <SectionRenderer section={section} settings={settings} context={context} flags={renderFlags} />
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
          );

          // Fiche produit : galerie et informations côte à côte (empilées sur
          // mobile), comme une vraie page produit — pas deux blocs pleine largeur.
          const gallery = template?.type === "product" ? sections.find((entry) => entry.type === "product-gallery") : undefined;
          const info = template?.type === "product" ? sections.find((entry) => entry.type === "product-info") : undefined;
          const paired = Boolean(gallery && info);
          const rest = paired
            ? sections.filter((entry) => entry !== gallery && entry !== info)
            : sections;

          return (
            <>
              {paired && gallery && info ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: device === "mobile" ? "1fr" : "minmax(0, 1.05fr) minmax(0, 0.95fr)",
                    gap: device === "mobile" ? 16 : 40,
                    alignItems: "start",
                    width: "100%",
                    maxWidth: 1320,
                    margin: "0 auto",
                  }}
                >
                  {sectionNode(gallery)}
                  {sectionNode(info)}
                </div>
              ) : null}
              {rest.map((section) => sectionNode(section))}
            </>
          );
        })()}
      </main>

      {flags.showChrome !== false ? (
        <footer data-chrome="footer" style={{ borderTop: "1px solid var(--t-border)" }}>
          {visible(document.footer).map((section) => (
            <RevealWrapper key={section.id} section={section} editable={flags.editable}>
              <SectionRenderer section={section} settings={settings} context={context} flags={renderFlags} />
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
