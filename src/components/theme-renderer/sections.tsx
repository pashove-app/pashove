"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { MarkdownBody } from "@/components/storefront/markdown-body";
import { ServiceBookingBox } from "@/components/storefront/service-booking-box";
import { cn } from "@/lib/cn";
import type {
  ThemeBlockInstance,
  ThemeSectionInstance,
  ThemeSettings,
} from "@/lib/theme-editor/types";
import type { ThemeRenderContext, ThemeRenderFlags } from "@/components/theme-renderer/context";
import {
  resolveText,
  sectionVisual,
  settingBoolean,
  settingNumber,
  settingString,
  translate,
} from "@/components/theme-renderer/style";
import {
  CollectionCardView,
  CtaLink,
  ProductCardView,
  PostCardView,
  Prose,
  RatingStars,
  SectionHeading,
  SmartImage,
  resolveHref,
} from "@/components/theme-renderer/primitives";

type SectionProps = {
  section: ThemeSectionInstance;
  settings: ThemeSettings;
  context: ThemeRenderContext;
  flags: ThemeRenderFlags;
};

const money = (amount: number, context: ThemeRenderContext): string => {
  try {
    return new Intl.NumberFormat(context.localeTag, {
      style: "currency",
      currency: context.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${context.currency}`;
  }
};

function text(
  section: ThemeSectionInstance,
  key: string,
  context: ThemeRenderContext,
  fallback = "",
): string {
  return resolveText(section.settings, key, context.metafields, fallback);
}

function num(section: ThemeSectionInstance, key: string, fallback: number): number {
  return settingNumber(section.settings, key, fallback);
}

function bool(section: ThemeSectionInstance, key: string, fallback = false): boolean {
  return settingBoolean(section.settings, key, fallback);
}

function columns(section: ThemeSectionInstance, fallback = 3): number {
  return Math.max(1, Math.min(6, num(section, "columnsDesktop", fallback)));
}

function visibleBlocks(section: ThemeSectionInstance): ThemeBlockInstance[] {
  return section.blocks.filter((block) => block.visible !== false);
}

function imageOf(
  section: ThemeSectionInstance,
  context: ThemeRenderContext,
  key = "imageUrl",
): string | null {
  const value = text(section, key, context);
  return value || null;
}

/* ------------------------------------------------------------------ *
 *  Enveloppes
 * ------------------------------------------------------------------ */

function BlockSlot({
  section,
  block,
  flags,
  children,
  className,
  style,
}: {
  section: ThemeSectionInstance;
  block: ThemeBlockInstance;
  flags: ThemeRenderFlags;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const selected = flags.selectedBlockId === block.id;

  return (
    <div
      className={cn("relative", className)}
      style={{
        ...style,
        outline: selected ? "2px solid #2F5CFF" : undefined,
        outlineOffset: selected ? 3 : undefined,
      }}
    >
      {children}
      {flags.editable ? (
        <button
          type="button"
          aria-label={`Sélectionner le bloc ${block.type}`}
          className="absolute inset-0 z-20 cursor-pointer rounded-[inherit] bg-transparent"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            flags.onSelectBlock?.(section.id, block.id);
          }}
        />
      ) : null}
    </div>
  );
}

/** Enveloppe commune : styles de section, révélation, sélection dans l’éditeur. */
export function SectionRenderer({ section, settings, context, flags }: SectionProps) {
  const visual = sectionVisual(section, settings);
  const selected = flags.selectedSectionId === section.id;
  const content = renderBody({ section, settings, context, flags });

  if (content === null) return null;

  const style: CSSProperties = {
    ...visual.wrapper,
    ...visual.vars,
    position: flags.editable ? "relative" : visual.wrapper.position,
    outline: selected ? "2px solid #2F5CFF" : undefined,
    outlineOffset: selected ? -2 : undefined,
  } as CSSProperties;

  if (section.type === "header" && !flags.editable) {
    if (bool(section, "sticky", true)) {
      style.position = "sticky";
      style.top = 0;
      style.zIndex = 30;
      style.backdropFilter = "blur(14px)";
    }
    if (bool(section, "transparent")) {
      style.background = "transparent";
    }
  }

  if (settingString(section.settings, "htmlTag", "section") === "div") {
    return (
      <div id={text(section, "cssId", context)} className={text(section, "cssClass", context)} style={style}>
        <div style={visual.inner}>{content}</div>
        {flags.editable ? (
          <button
            type="button"
            aria-label="Sélectionner la section"
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            onClick={() => flags.onSelectSection?.(section.id)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <section
      id={text(section, "cssId", context) || `section-${section.id}`}
      className={text(section, "cssClass", context)}
      style={style}
      data-section-type={section.type}
      data-section-id={section.id}
    >
      <div style={visual.inner}>{content}</div>
      {flags.editable ? (
        <button
          type="button"
          aria-label="Sélectionner la section"
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          onClick={() => flags.onSelectSection?.(section.id)}
        />
      ) : null}
      {selected ? (
        <span
          className="absolute left-2 top-2 z-30 rounded-md bg-[#2F5CFF] px-2 py-1 text-[10px] font-semibold text-white"
          style={{ pointerEvents: "none" }}
        >
          {section.name || section.type}
        </span>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Mise en page de section
 * ------------------------------------------------------------------ */

function grid(columnsCount: number, gap: number): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
    gap: `${gap}px`,
    width: "100%",
  };
}

function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--s-radius, var(--t-radius))",
        border: "1px solid var(--s-border, var(--t-border))",
        background: "color-mix(in srgb, var(--s-text, var(--t-text)) 3%, transparent)",
        padding: "1.25rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Composants interactifs
 * ------------------------------------------------------------------ */

function Slideshow({ section, settings, context, flags }: SectionProps) {
  const slides = visibleBlocks(section);
  const [index, setIndex] = useState(0);
  const autoplay = bool(section, "autoplay", true);
  const speed = num(section, "autoplaySpeed", 5000);

  useEffect(() => {
    if (!autoplay || slides.length < 2 || flags.editable) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      Math.max(2000, speed),
    );
    return () => window.clearInterval(timer);
  }, [autoplay, speed, slides.length, flags.editable]);

  if (slides.length === 0) return <Prose text="Ajoute une diapositive dans le panneau de gauche." />;

  const slide = slides[Math.min(index, slides.length - 1)];
  const slideSettings = slide.settings;
  const image = settingString(slideSettings, "imageUrl");
  const alt = settingString(slideSettings, "imageAlt", slide.type);
  const align = settingString(slideSettings, "textAlign", "left");
  const overlay = settingBoolean(slideSettings, "overlay", true);

  return (
    <div className="relative w-full overflow-hidden" style={{ borderRadius: "var(--s-radius, 24px)" }}>
      <div className="relative flex min-h-[380px] items-end" style={{ minHeight: "clamp(360px, 44vw, 560px)" }}>
        <SmartImage src={image || null} alt={alt} ratio="auto" radius={0} style={{ position: "absolute", inset: 0, height: "100%", objectFit: "cover" }} />
        {overlay ? <div style={{ position: "absolute", inset: 0, background: "rgb(0 0 0 / 0.45)" }} /> : null}
        <div className="relative z-10 w-full p-6 sm:p-10" style={{ color: "#fff", textAlign: align as CSSProperties["textAlign"] }}>
          {settingString(slideSettings, "heading") ? (
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, margin: 0, lineHeight: 1.05 }}>
              {settingString(slideSettings, "heading")}
            </h2>
          ) : null}
          {settingString(slideSettings, "text") ? (
            <p style={{ margin: "0.8rem 0 0", maxWidth: 560, fontSize: "1rem", lineHeight: 1.6 }}>
              {settingString(slideSettings, "text")}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: align === "center" ? "center" : "flex-start", flexWrap: "wrap" }}>
            {settingString(slideSettings, "buttonLabel") ? (
              <CtaLink label={settingString(slideSettings, "buttonLabel")} href={settingString(slideSettings, "buttonLink")} context={context} />
            ) : null}
          </div>
        </div>
      </div>
      {slides.length > 1 && bool(section, "showArrows", true) ? (
        <>
          <button type="button" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm" onClick={() => setIndex((index - 1 + slides.length) % slides.length)} aria-label="Précédent">‹</button>
          <button type="button" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm" onClick={() => setIndex((index + 1) % slides.length)} aria-label="Suivant">›</button>
        </>
      ) : null}
      {slides.length > 1 && bool(section, "showDots", true) ? (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((entry, dotIndex) => (
            <button
              key={entry.id}
              type="button"
              aria-label={`Diapositive ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
              className="h-2.5 w-2.5 rounded-full border border-white/70"
              style={{ background: dotIndex === index ? "#fff" : "transparent" }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BeforeAfter({ section, context }: { section: ThemeSectionInstance; context: ThemeRenderContext }) {
  const [value, setValue] = useState(50);
  const before = imageOf(section, context, "imageBefore");
  const after = imageOf(section, context, "imageAfter");
  return (
    <div className="relative w-full overflow-hidden" style={{ borderRadius: "var(--t-radius)" }}>
      <SmartImage src={after} alt={text(section, "labelAfter", context, "Après")} ratio="16:9" radius={0} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - value}% 0 0)` }}>
        <SmartImage src={before} alt={text(section, "labelBefore", context, "Avant")} ratio="16:9" radius={0} style={{ height: "100%" }} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="absolute inset-x-0 bottom-3 z-10 w-full"
        aria-label="Comparer avant et après"
      />
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${value}%`, width: 2, background: "#fff" }} />
    </div>
  );
}

function Countdown({ section }: { section: ThemeSectionInstance }) {
  const target = text(section, "targetDate", {} as ThemeRenderContext, "");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const targetTime = target ? new Date(target.replace(" ", "T")).getTime() : 0;
  const diff = Math.max(0, targetTime - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const cells = [
    bool(section, "showDays", true) ? { label: "Jours", value: days } : null,
    bool(section, "showHours", true) ? { label: "Heures", value: hours } : null,
    bool(section, "showMinutes", true) ? { label: "Minutes", value: minutes } : null,
    bool(section, "showSeconds", true) ? { label: "Secondes", value: seconds } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
      {cells.map((cell) => (
        <div key={cell.label} style={{ minWidth: 74, borderRadius: 14, border: "1px solid var(--s-border, var(--t-border))", padding: "0.7rem 0.9rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{String(cell.value).padStart(2, "0")}</p>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--s-muted, var(--t-muted))" }}>{cell.label}</p>
        </div>
      ))}
    </div>
  );
}

function Gallery({ section, settings, context, flags }: SectionProps) {
  const images = visibleBlocks(section);
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <>
      <div style={grid(columns(section, settings.productCard.imageRatio === "square" ? 3 : 3), num(section, "columnGap", 12))}>
        {images.map((block) => (
          <BlockSlot key={block.id} section={section} block={block} flags={flags}>
            <button
              type="button"
              className="block w-full overflow-hidden"
              style={{ borderRadius: "var(--s-radius, var(--t-radius))" }}
              onClick={() => bool(section, "lightbox", true) && setLightbox(settingString(block.settings, "imageUrl"))}
            >
              <SmartImage
                src={settingString(block.settings, "imageUrl") || null}
                alt={settingString(block.settings, "alt")}
                ratio={settingString(block.settings, "imageRatio", "1:1")}
                fit={settingString(block.settings, "imageFit", "cover") as "cover" | "contain" | "fill"}
              />
            </button>
          </BlockSlot>
        ))}
      </div>
      {lightbox ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      ) : null}
    </>
  );
}

function Popup({ section, context }: { section: ThemeSectionInstance; context: ThemeRenderContext }) {
  const [open, setOpen] = useState(false);
  const trigger = text(section, "trigger", context, "delay");
  const delay = num(section, "delay", 4000);

  useEffect(() => {
    if (trigger === "delay") {
      const timer = window.setTimeout(() => setOpen(true), Math.max(500, delay));
      return () => window.clearTimeout(timer);
    }
    if (trigger === "scroll") {
      const handler = () => {
        if (window.scrollY > window.innerHeight * 0.45) setOpen(true);
      };
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler);
    }
    const handler = (event: MouseEvent) => {
      if (event.clientY <= 0) setOpen(true);
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [trigger, delay]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl" style={{ background: "var(--t-bg)", color: "var(--t-text)", border: "1px solid var(--t-border)" }}>
        <button type="button" className="absolute right-3 top-3 z-10 rounded-full bg-black/20 px-2 py-1 text-sm text-white" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
        {imageOf(section, context) ? <SmartImage src={imageOf(section, context)} alt={text(section, "heading", context)} ratio="16:9" radius={0} /> : null}
        <div className="p-6">
          <SectionHeading eyebrow={text(section, "eyebrow", context)} heading={text(section, "heading", context)} subheading={text(section, "subheading", context) || text(section, "text", context)} />
          <div className="mt-5">
            <CtaLink label={text(section, "buttonLabel", context, "Découvrir")} href={text(section, "buttonLink", context)} context={context} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductTabs({ section, context, settings }: SectionProps) {
  const [active, setActive] = useState("details");
  const product = context.product;
  if (!product) return <Prose text="Choisis un produit pour prévisualiser ce modèle." />;

  const tabs = [
    { id: "details", label: text(section, "detailsLabel", context, "Détails"), content: product.description || "Aucune description." },
    bool(section, "showShipping", true)
      ? { id: "shipping", label: text(section, "shippingLabel", context, "Livraison"), content: context.shippingLabel ?? "Livraison calculée au paiement." }
      : null,
    bool(section, "showSpecs", true)
      ? { id: "specs", label: text(section, "specsLabel", context, "Caractéristiques"), content: `Type : ${product.product_type}\nStock : ${product.stock_quantity ?? "—"}\nVariantes : ${product.variants.length || "—"}` }
      : null,
  ].filter(Boolean) as { id: string; label: string; content: string }[];

  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid var(--t-border)", paddingBottom: 10 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            style={{
              minHeight: 40,
              padding: "0 0.9rem",
              borderRadius: 999,
              border: "1px solid",
              borderColor: active === tab.id ? "var(--t-accent)" : "var(--t-border)",
              background: active === tab.id ? "var(--t-accent)" : "transparent",
              color: active === tab.id ? "#fff" : "var(--t-text)",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p style={{ whiteSpace: "pre-line", marginTop: 16, color: "var(--t-muted)", lineHeight: 1.7 }}>
        {current?.content}
      </p>
    </div>
  );
}

function ProductInfo({ section, context, settings, flags }: SectionProps) {
  const product = context.product;
  if (!product) {
    return (
      <div style={{ width: "100%" }}>
        <SectionHeading heading="Nom du produit" subheading="Sélectionne un produit dans l’aperçu pour voir ses informations réelles." />
      </div>
    );
  }

  const images = context.productImages ?? [];

  return (
    <div style={{ width: "100%", display: "grid", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", lineHeight: 1.08, fontWeight: 650 }}>
          {product.name}
        </h1>
        {bool(section, "showDescription", true) && product.description ? (
          <p style={{ marginTop: 10, color: "var(--t-muted)", lineHeight: 1.7 }}>{product.description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <p style={{ margin: 0, fontSize: "1.7rem", fontWeight: 700 }}>{product.priceLabel}</p>
        {product.compareAtLabel ? (
          <p style={{ margin: 0, color: "var(--t-muted)", textDecoration: "line-through" }}>{product.compareAtLabel}</p>
        ) : null}
        {product.discountPercent ? (
          <span style={{ borderRadius: 6, background: "var(--t-text)", color: "var(--t-bg)", padding: "2px 7px", fontSize: "0.7rem", fontWeight: 700 }}>-{product.discountPercent}%</span>
        ) : null}
      </div>

      {flags.editable ? (
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          {product.options.map((option) => (
            <div key={option.name}>
              <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 600 }}>{option.name}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {option.values.map((value) => (
                  <span key={value} style={{ border: "1px solid var(--t-border)", borderRadius: 999, padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}>{value}</span>
                ))}
              </div>
            </div>
          ))}
          <button type="button" style={{ minHeight: 46, borderRadius: 999, background: "var(--t-btn-bg)", color: "var(--t-btn-text)", fontWeight: 700, border: 0 }} onClick={(event) => event.preventDefault()}>
            {text(section, "buttonLabel", context, translate(settings, "addToCart", "Ajouter au panier"))}
          </button>
          {bool(section, "showPaymentIcons", true) ? <PaymentPills context={context} /> : null}
        </div>
      ) : product.product_type === "service" ? (
        <ServiceBookingBox productId={product.id} slots={context.serviceSlots ?? []} />
      ) : (
        <div style={{ maxWidth: 520 }}>
          <ProductBuyBox product={product} codEnabled={context.codEnabled} />
          {bool(section, "showPaymentIcons", true) ? <div style={{ marginTop: 14 }}><PaymentPills context={context} /></div> : null}
        </div>
      )}

      {images.length > 0 ? null : null}
    </div>
  );
}

function PaymentPills({ context }: { context: ThemeRenderContext }) {
  if (context.paymentMethods.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {context.paymentMethods.map((method) => (
        <span key={method} style={{ borderRadius: 6, border: "1px solid var(--t-border)", padding: "0.3rem 0.55rem", fontSize: "0.65rem", fontWeight: 600, color: "var(--t-muted)" }}>
          {method}
        </span>
      ))}
    </div>
  );
}

function NewsletterForm({
  section,
  context,
  settings,
}: {
  section: ThemeSectionInstance;
  context: ThemeRenderContext;
  settings: ThemeSettings;
}) {
  const [done, setDone] = useState(false);
  return (
    <form
      className="w-full"
      style={{ maxWidth: 520 }}
      onSubmit={(event) => {
        event.preventDefault();
        setDone(true);
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          required
          placeholder={text(section, "placeholder", context, "ton@email.com")}
          style={{ flex: "1 1 220px", minHeight: 46, borderRadius: 999, border: "1px solid var(--s-border, var(--t-border))", padding: "0 1rem", background: "transparent", color: "inherit" }}
        />
        <button type="submit" style={{ minHeight: 46, borderRadius: 999, border: 0, padding: "0 1.3rem", background: "var(--s-btn-bg, var(--t-btn-bg))", color: "var(--s-btn-text, var(--t-btn-text))", fontWeight: 700 }}>
          {text(section, "buttonLabel", context, translate(settings, "newsletterButton", "S’inscrire"))}
        </button>
      </div>
      {done ? <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--s-accent, var(--t-accent))" }}>Merci ! Ton inscription est enregistrée.</p> : null}
      {text(section, "privacyText", context) ? <p style={{ margin: "0.6rem 0 0", fontSize: "0.7rem", color: "var(--s-muted, var(--t-muted))" }}>{text(section, "privacyText", context)}</p> : null}
    </form>
  );
}

function productList(context: ThemeRenderContext): ThemeRenderContext["products"] {
  return context.products;
}

function featuredProducts(section: ThemeSectionInstance, context: ThemeRenderContext) {
  const limit = Math.max(2, num(section, "productLimit", 8));
  const collectionId = text(section, "collectionId", context);
  if (collectionId && context.collection) return context.collection.products.slice(0, limit);
  if (collectionId) {
    const collection = context.collections.find((entry) => entry.id === collectionId);
    if (collection) return productList(context).slice(0, limit);
  }
  return productList(context).slice(0, limit);
}

function SocialLinks({ settings, context }: { settings: ThemeSettings; context: ThemeRenderContext }) {
  const entries: { label: string; href: string }[] = [
    { label: "Instagram", href: settings.socialInstagram },
    { label: "Facebook", href: settings.socialFacebook },
    { label: "TikTok", href: settings.socialTiktok },
    { label: "YouTube", href: settings.socialYoutube },
    { label: "Pinterest", href: settings.socialPinterest },
    { label: "X", href: settings.socialX },
    { label: "LinkedIn", href: settings.socialLinkedin },
    { label: "WhatsApp", href: settings.socialWhatsapp },
  ].filter((entry) => entry.href);

  if (entries.length === 0) {
    return <p style={{ color: "var(--s-muted, var(--t-muted))", fontSize: "0.8rem" }}>Ajoute tes réseaux dans les paramètres du thème.</p>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {entries.map((entry) => (
        <a key={entry.label} href={entry.href} target="_blank" rel="noreferrer" style={{ borderRadius: 999, border: "1px solid var(--s-border, var(--t-border))", padding: "0.4rem 0.8rem", fontSize: "0.75rem", fontWeight: 600, color: "inherit", textDecoration: "none" }}>
          {entry.label}
        </a>
      ))}
    </div>
  );
}

function PaymentFooter({ settings, context }: { settings: ThemeSettings; context: ThemeRenderContext }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {context.paymentMethods.map((method) => (
        <span key={method} style={{ borderRadius: 6, border: "1px solid var(--s-border, var(--t-border))", padding: "0.28rem 0.5rem", fontSize: "0.65rem", fontWeight: 600 }}>{method}</span>
      ))}
      <span style={{ fontSize: "0.7rem", color: "var(--s-muted, var(--t-muted))" }}>
        {context.currency}{settings.currencyShowCode ? "" : ""}
      </span>
    </div>
  );
}

function collectionCards(section: ThemeSectionInstance, context: ThemeRenderContext, settings: ThemeSettings, flags: ThemeRenderFlags) {
  const blocks = visibleBlocks(section);
  const cols = columns(section, 3);

  if (blocks.length > 0) {
    return (
      <div style={grid(cols, num(section, "columnGap", 20))}>
        {blocks.map((block) => {
          const id = settingString(block.settings, "collectionId");
          const collection = context.collections.find((entry) => entry.id === id) ?? context.collections[0];
          if (!collection) return null;
          return (
            <BlockSlot key={block.id} section={section} block={block} flags={flags}>
              <CollectionCardView collection={{ ...collection, name: settingString(block.settings, "heading") || collection.name }} context={context} settings={settings} />
            </BlockSlot>
          );
        })}
      </div>
    );
  }

  return (
    <div style={grid(cols, num(section, "columnGap", 20))}>
      {context.collections.slice(0, 8).map((collection) => (
        <CollectionCardView key={collection.id} collection={collection} context={context} settings={settings} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Rendu par type
 * ------------------------------------------------------------------ */

function renderBody({ section, settings, context, flags }: SectionProps): ReactNode {
  const type = section.type;
  const align = text(section, "textAlign", context, "left");
  const headingBlock = (
    <SectionHeading
      eyebrow={text(section, "eyebrow", context)}
      heading={text(section, "heading", context)}
      subheading={text(section, "subheading", context)}
      align={text(section, "bodyAlign", context, align)}
    />
  );

  const blocks = visibleBlocks(section);

  switch (type) {
    case "announcement-bar": {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", gap: 10, width: "100%", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{text(section, "text", context, "Livraison offerte dès 50 000 FCFA")}</span>
          {text(section, "linkLabel", context) ? (
            <a href={resolveHref(text(section, "link", context, "#"), context)} style={{ fontSize: "0.75rem", fontWeight: 700, textDecoration: "underline", color: "inherit" }}>
              {text(section, "linkLabel", context)}
            </a>
          ) : null}
        </div>
      );
    }

    case "header":
    case "navigation-menu":
    case "mega-menu":
    case "mobile-nav": {
      const logo = settings.logoUrl || context.logoUrl;
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
          <a href={context.homePath} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={settings.logoAlt || context.storeName} style={{ height: settings.logoWidth, width: "auto", borderRadius: 10, objectFit: "contain" }} />
            ) : (
              <span style={{ display: "grid", placeItems: "center", height: settings.logoWidth, width: settings.logoWidth, borderRadius: 12, background: "var(--t-accent)", color: "#fff", fontWeight: 800 }}>
                {context.storeName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span style={{ fontSize: "1rem", fontWeight: 650, letterSpacing: "-0.02em" }}>{context.storeName}</span>
          </a>

          <nav className="hidden items-center gap-5 md:flex" aria-label="Navigation principale">
            {context.nav.slice(0, 8).map((item) => (
              <a key={item.href + item.label} href={resolveHref(item.href, context)} style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--s-muted, var(--t-muted))", textDecoration: "none" }}>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {bool(section, "showSearch", true) ? (
              <a href={`${context.homePath}/search`} aria-label={translate(settings, "searchTitle", "Rechercher")} style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 12, color: "inherit", textDecoration: "none" }}>⌕</a>
            ) : null}
            {bool(section, "showAccount", true) ? (
              <a href={`${context.homePath}/account`} aria-label={translate(settings, "navAccount", "Mon compte")} style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 12, color: "inherit", textDecoration: "none" }}>◯</a>
            ) : null}
            {bool(section, "showCart", true) ? (
              <a href={`${context.homePath}/cart`} aria-label={translate(settings, "viewCart", "Panier")} style={{ display: "grid", placeItems: "center", minWidth: 40, height: 40, borderRadius: 12, border: "1px solid var(--s-border, var(--t-border))", color: "inherit", textDecoration: "none", padding: "0 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
                {translate(settings, "viewCart", "Panier")}{context.cart?.count ? ` · ${context.cart.count}` : ""}
              </a>
            ) : null}
          </div>
        </div>
      );
    }

    case "image-banner": {
      const image = imageOf(section, context);
      const overlay = bool(section, "overlay", true);
      const opacity = num(section, "overlayOpacity", 45) / 100;
      const position = text(section, "contentPosition", context, "left");
      return (
        <div className="relative flex w-full overflow-hidden" style={{ minHeight: "inherit", borderRadius: "var(--s-radius, 0)" }}>
          {image ? (
            <SmartImage src={image} alt={text(section, "imageAlt", context)} ratio="auto" radius={0} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: settingString(section.settings, "imageFit", "cover") as "cover" | "contain" | "fill" }} />
          ) : null}
          {overlay ? <div style={{ position: "absolute", inset: 0, background: `rgb(0 0 0 / ${opacity})` }} /> : null}
          <div className="relative z-10 flex w-full flex-col" style={{ alignItems: position === "center" ? "center" : position === "right" ? "flex-end" : "flex-start", justifyContent: "center", padding: "clamp(2rem, 6vw, 4rem)", color: "#fff", textAlign: position as CSSProperties["textAlign"], minHeight: "inherit" }}>
            <div style={{ maxWidth: 720 }}>
              {text(section, "eyebrow", context) ? <p style={{ margin: "0 0 0.7rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em" }}>{text(section, "eyebrow", context)}</p> : null}
              <h1 style={{ margin: 0, fontFamily: "var(--s-heading-font, inherit)", fontSize: "clamp(2.2rem, 5vw, var(--s-heading-size, 3.5rem))", lineHeight: "var(--s-heading-line, 1.05)", fontWeight: 700, letterSpacing: "var(--s-heading-tracking, 0)" }}>
                {text(section, "heading", context, context.storeName)}
              </h1>
              {text(section, "subheading", context) ? <p style={{ margin: "1rem 0 0", maxWidth: 560, color: "rgb(255 255 255 / 0.88)", fontSize: "1rem", lineHeight: 1.6 }}>{text(section, "subheading", context)}</p> : null}
              <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: position === "center" ? "center" : position === "right" ? "flex-end" : "flex-start" }}>
                <CtaLink label={text(section, "buttonLabel", context)} href={text(section, "buttonLink", context)} context={context} />
                <CtaLink label={text(section, "buttonLabel2", context)} href={text(section, "buttonLink2", context)} context={context} secondary />
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "slideshow":
      return <Slideshow section={section} settings={settings} context={context} flags={flags} />;

    case "video": {
      const url = text(section, "videoUrl", context);
      const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ marginTop: 18, overflow: "hidden", borderRadius: "var(--s-radius, var(--t-radius))", border: "1px solid var(--s-border, var(--t-border))", background: "#000" }}>
            {youtube ? (
              <iframe title={text(section, "heading", context, "Vidéo")} src={`https://www.youtube.com/embed/${youtube[1]}`} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen />
            ) : url ? (
              <video src={url} controls={bool(section, "controls", true)} autoPlay={bool(section, "autoplay")} loop={bool(section, "loop", true)} playsInline poster={text(section, "posterUrl", context) || undefined} className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm" style={{ color: "var(--s-muted, var(--t-muted))" }}>Ajoute une vidéo</div>
            )}
          </div>
        </div>
      );
    }

    case "image-with-text": {
      const image = imageOf(section, context);
      const position = text(section, "mediaPosition", context, "left");
      return (
        <div style={{ display: "grid", gap: 32, width: "100%", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "center" }}>
          <div style={{ order: position === "right" ? 2 : 1 }}>
            <SmartImage src={image} alt={text(section, "imageAlt", context)} ratio={text(section, "imageRatio", context, "4:3")} fit={settingString(section.settings, "imageFit", "cover") as "cover" | "contain" | "fill"} radius={num(section, "cornerRadius", settings.mediaRadius)} />
          </div>
          <div style={{ order: position === "right" ? 1 : 2 }}>
            {headingBlock}
            {text(section, "text", context) ? <div style={{ marginTop: 14 }}><Prose text={text(section, "text", context)} /></div> : null}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <CtaLink label={text(section, "buttonLabel", context)} href={text(section, "buttonLink", context)} context={context} />
              <CtaLink label={text(section, "buttonLabel2", context)} href={text(section, "buttonLink2", context)} context={context} secondary />
            </div>
          </div>
        </div>
      );
    }

    case "collage": {
      const layout = text(section, "collageLayout", context, "3");
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(layout === "2" ? 2 : layout === "4" ? 2 : 3, num(section, "columnGap", 12)), marginTop: 20 }}>
            {blocks.map((block, index) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags} style={layout === "mosaic" && index === 0 ? { gridColumn: "span 2" } : undefined}>
                <SmartImage src={settingString(block.settings, "imageUrl") || null} alt={settingString(block.settings, "alt")} ratio={index === 0 ? "16:9" : "1:1"} radius={num(section, "cornerRadius", settings.mediaRadius)} />
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "before-after":
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ marginTop: 18 }}><BeforeAfter section={section} context={context} /></div>
        </div>
      );

    case "gallery":
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ marginTop: 18 }}><Gallery section={section} settings={settings} context={context} flags={flags} /></div>
        </div>
      );

    case "rich-text":
    case "custom-section": {
      return (
        <div style={{ maxWidth: "var(--t-content-width, 960px)", width: "100%", marginInline: align === "center" ? "auto" : undefined }}>
          {headingBlock}
          {text(section, "text", context) ? <div style={{ marginTop: 16 }}><Prose text={text(section, "text", context)} /></div> : null}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: align as CSSProperties["justifyContent"] }}>
            <CtaLink label={text(section, "buttonLabel", context)} href={text(section, "buttonLink", context)} context={context} />
            <CtaLink label={text(section, "buttonLabel2", context)} href={text(section, "buttonLink2", context)} context={context} secondary />
          </div>
        </div>
      );
    }

    case "multicolumn": {
      const cols = columns(section, 3);
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(cols, num(section, "columnGap", 20)), marginTop: 24 }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags}>
                <Card style={{ height: "100%" }}>
                  {settingString(block.settings, "imageUrl") ? (
                    <div style={{ marginBottom: 14 }}>
                      <SmartImage src={settingString(block.settings, "imageUrl")} alt={settingString(block.settings, "heading")} ratio="16:9" radius={12} />
                    </div>
                  ) : settingString(block.settings, "icon") ? (
                    <span style={{ display: "inline-grid", placeItems: "center", width: 40, height: 40, borderRadius: 12, background: "var(--s-accent, var(--t-accent))", color: "#fff", fontWeight: 700, marginBottom: 12 }}>
                      {settingString(block.settings, "icon").slice(0, 1).toUpperCase()}
                    </span>
                  ) : null}
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{settingString(block.settings, "heading")}</p>
                  {settingString(block.settings, "text") ? <p style={{ margin: "0.45rem 0 0", color: "var(--s-muted, var(--t-muted))", fontSize: "0.85rem", lineHeight: 1.6 }}>{settingString(block.settings, "text")}</p> : null}
                  {settingString(block.settings, "linkLabel") ? (
                    <a href={resolveHref(settingString(block.settings, "link"), context)} style={{ display: "inline-block", marginTop: 10, fontSize: "0.78rem", fontWeight: 700, color: "var(--s-accent, var(--t-accent))" }}>{settingString(block.settings, "linkLabel")}</a>
                  ) : null}
                </Card>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "testimonials": {
      const cols = columns(section, 3);
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(cols, num(section, "columnGap", 16)), marginTop: 24 }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags}>
                <Card style={{ height: "100%" }}>
                  <RatingStars rating={num({ settings: block.settings } as ThemeSectionInstance, "rating", 5)} />
                  <p style={{ margin: "0.8rem 0 0", fontSize: "0.9rem", lineHeight: 1.65 }}>“{settingString(block.settings, "text")}”</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                    {settingString(block.settings, "imageUrl") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settingString(block.settings, "imageUrl")} alt="" style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover" }} />
                    ) : null}
                    <div>
                      <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700 }}>{settingString(block.settings, "name")}</p>
                      {settingString(block.settings, "role") ? <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--s-muted, var(--t-muted))" }}>{settingString(block.settings, "role")}</p> : null}
                    </div>
                  </div>
                </Card>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "faq":
    case "collapsible-content": {
      return (
        <div style={{ width: "100%", maxWidth: 820 }}>
          {headingBlock}
          <div style={{ marginTop: 20, borderTop: "1px solid var(--s-border, var(--t-border))" }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags} style={{ borderBottom: "1px solid var(--s-border, var(--t-border))" }}>
                <details style={{ padding: "0.9rem 0" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", listStyle: "none" }}>
                    {settingString(block.settings, "question") || settingString(block.settings, "heading")}
                  </summary>
                  <p style={{ margin: "0.6rem 0 0", color: "var(--s-muted, var(--t-muted))", fontSize: "0.85rem", lineHeight: 1.65 }}>
                    {settingString(block.settings, "answer") || settingString(block.settings, "text")}
                  </p>
                </details>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "team": {
      const cols = columns(section, 3);
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(cols, num(section, "columnGap", 20)), marginTop: 24 }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags}>
                <div style={{ textAlign: "center" }}>
                  <SmartImage src={settingString(block.settings, "imageUrl") || null} alt={settingString(block.settings, "name")} ratio="1:1" radius={999} />
                  <p style={{ margin: "0.7rem 0 0", fontWeight: 700 }}>{settingString(block.settings, "name")}</p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--s-muted, var(--t-muted))" }}>{settingString(block.settings, "role")}</p>
                </div>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "timeline": {
      return (
        <div style={{ width: "100%", maxWidth: 760 }}>
          {headingBlock}
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, borderLeft: "2px solid var(--s-accent, var(--t-accent))", paddingLeft: 18 }}>
                  <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--s-accent, var(--t-accent))" }}>{settingString(block.settings, "date")}</p>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{settingString(block.settings, "heading")}</p>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--s-muted, var(--t-muted))", lineHeight: 1.6 }}>{settingString(block.settings, "text")}</p>
                  </div>
                </div>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "quote": {
      return (
        <div style={{ maxWidth: 820, marginInline: "auto", textAlign: "center" }}>
          <p style={{ margin: 0, fontFamily: "var(--s-heading-font, inherit)", fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.35 }}>
            “{text(section, "text", context)}”
          </p>
          {text(section, "author", context) ? <p style={{ margin: "1rem 0 0", fontWeight: 700 }}>{text(section, "author", context)}</p> : null}
          {text(section, "role", context) ? <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--s-muted, var(--t-muted))" }}>{text(section, "role", context)}</p> : null}
        </div>
      );
    }

    case "featured-collection":
    case "product-grid":
    case "new-arrivals":
    case "best-sellers":
    case "promotions":
    case "complementary-products":
    case "product-related": {
      const cols = columns(section, 4);
      const limit = Math.max(2, num(section, "productLimit", 8));
      let products = featuredProducts(section, context);

      if (type === "product-grid") {
        const selected = blocks
          .map((block) => settingString(block.settings, "productId"))
          .filter(Boolean);
        if (selected.length > 0) {
          const list = selected
            .map((id) => context.products.find((product) => product.id === id))
            .filter(Boolean) as ThemeRenderContext["products"];
          if (list.length > 0) products = list;
        }
      }
      if (type === "promotions") products = products.filter((product) => product.discountPercent);
      if (type === "complementary-products" || type === "product-related") {
        products = products.filter((product) => product.id !== context.product?.id);
      }
      if (type === "best-sellers") products = [...products].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
      if (type === "new-arrivals") products = [...products].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));

      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          {type === "featured-collection" && bool(section, "showViewAll", true) ? (
            <div style={{ marginTop: 8 }}>
              <CtaLink label={text(section, "buttonLabel", context, "Voir la collection")} href={text(section, "buttonLink", context, "/collections")} context={context} secondary />
            </div>
          ) : null}
          <div style={{ ...grid(cols, num(section, "columnGap", settings.gridGapX)), marginTop: 22 }}>
            {products.slice(0, limit).map((product) => (
              <ProductCardView key={product.id} product={product} context={context} settings={settings} showPrice={bool(section, "showPrice", true)} showVendor={bool(section, "showVendor", false)} />
            ))}
            {products.length === 0 ? <p style={{ color: "var(--s-muted, var(--t-muted))", fontSize: "0.85rem" }}>Aucun produit à afficher pour l’instant.</p> : null}
          </div>
        </div>
      );
    }

    case "featured-product": {
      const product =
        context.products.find((entry) => entry.id === text(section, "productId", context)) ??
        context.products[0];
      if (!product) return <Prose text="Ajoute un produit pour utiliser cette section." />;
      return (
        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", alignItems: "center", width: "100%" }}>
          <SmartImage src={product.imageUrl} alt={product.name} ratio="4:5" radius={settings.mediaRadius} />
          <div>
            {headingBlock}
            <p style={{ margin: "1rem 0 0", fontSize: "1.5rem", fontWeight: 700 }}>{product.priceLabel}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <CtaLink label={text(section, "buttonLabel", context, "Voir le produit")} href={`/products/${product.slug}`} context={context} />
            </div>
            {bool(section, "showPaymentIcons", true) ? <div style={{ marginTop: 14 }}><PaymentPills context={context} /></div> : null}
          </div>
        </div>
      );
    }

    case "collection-list":
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ marginTop: 22 }}>{collectionCards(section, context, settings, flags)}</div>
        </div>
      );

    case "newsletter":
    case "footer-newsletter": {
      const style = text(section, "style", context, "card");
      return (
        <div style={{ width: "100%", display: "grid", gap: 24, gridTemplateColumns: style === "split" ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr", alignItems: "center" }}>
          <div>{headingBlock}</div>
          <NewsletterForm section={section} context={context} settings={settings} />
        </div>
      );
    }

    case "countdown":
      return (
        <div style={{ width: "100%", textAlign: align as CSSProperties["textAlign"] }}>
          {headingBlock}
          <div style={{ marginTop: 18 }}><Countdown section={section} /></div>
        </div>
      );

    case "progress-bar": {
      const goal = Math.max(1, num(section, "goalAmount", 100000));
      const current = Math.max(0, num(section, "currentAmount", 0));
      const percent = Math.min(100, Math.round((current / goal) * 100));
      return (
        <div style={{ width: "100%", maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
          {headingBlock}
          <div style={{ marginTop: 16, height: 12, borderRadius: 999, background: "color-mix(in srgb, var(--s-text) 12%, transparent)", overflow: "hidden" }}>
            <div style={{ width: `${percent}%`, height: "100%", background: "var(--s-accent, var(--t-accent))" }} />
          </div>
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: "var(--s-muted, var(--t-muted))" }}>
            {current.toLocaleString(context.localeTag)} / {goal.toLocaleString(context.localeTag)} {text(section, "currency", context, context.currency)} · {percent} %
          </p>
        </div>
      );
    }

    case "trust-badges": {
      const cols = columns(section, 4);
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(cols, num(section, "columnGap", 16)), marginTop: 20 }}>
            {blocks.map((block) => (
              <BlockSlot key={block.id} section={section} block={block} flags={flags}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--s-accent) 14%, transparent)", color: "var(--s-accent, var(--t-accent))", fontWeight: 800 }}>
                    {settingString(block.settings, "icon").slice(0, 1).toUpperCase() || "✓"}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}>{settingString(block.settings, "heading")}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--s-muted, var(--t-muted))", lineHeight: 1.5 }}>{settingString(block.settings, "text")}</p>
                  </div>
                </div>
              </BlockSlot>
            ))}
          </div>
        </div>
      );
    }

    case "popup":
      return flags.editable ? (
        <div style={{ width: "100%", maxWidth: 560 }}>
          {headingBlock}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <CtaLink label={text(section, "buttonLabel", context)} href={text(section, "buttonLink", context)} context={context} />
          </div>
        </div>
      ) : (
        <Popup section={section} context={context} />
      );

    case "promo-banner": {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", width: "100%" }}>
          <span style={{ fontWeight: 600 }}>{text(section, "text", context)}</span>
          {text(section, "code", context) ? (
            <span style={{ borderRadius: 6, background: "color-mix(in srgb, var(--s-text) 12%, transparent)", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700 }}>{text(section, "code", context)}</span>
          ) : null}
          {text(section, "buttonLabel", context) ? <CtaLink label={text(section, "buttonLabel", context)} href={text(section, "buttonLink", context)} context={context} /> : null}
        </div>
      );
    }

    case "footer-brand":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {bool(section, "showLogo", true) && (settings.logoUrl || context.logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl || context.logoUrl || ""} alt="" style={{ height: settings.logoWidth, width: "auto", objectFit: "contain" }} />
              ) : (
                <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>{text(section, "heading", context) || context.storeName}</span>
              )}
            </div>
            {text(section, "text", context) || context.description ? (
              <p style={{ margin: "0.7rem 0 0", color: "var(--s-muted, var(--t-muted))", fontSize: "0.82rem", lineHeight: 1.65 }}>
                {text(section, "text", context) || context.description}
              </p>
            ) : null}
            {bool(section, "showContact", true) ? (
              <div style={{ marginTop: 12, display: "grid", gap: 4, fontSize: "0.78rem", color: "var(--s-muted, var(--t-muted))" }}>
                {context.contactEmail ? <a href={`mailto:${context.contactEmail}`} style={{ color: "inherit" }}>{context.contactEmail}</a> : null}
                {context.contactPhone ? <a href={`tel:${context.contactPhone}`} style={{ color: "inherit" }}>{context.contactPhone}</a> : null}
              </div>
            ) : null}
          </div>
          <nav style={{ display: "grid", gap: 10 }}>
            <a href={context.homePath} style={{ color: "inherit", fontSize: "0.8rem", textDecoration: "none" }}>Accueil</a>
            <a href={`${context.homePath}/products`} style={{ color: "inherit", fontSize: "0.8rem", textDecoration: "none" }}>Produits</a>
            <a href={`${context.homePath}/collections`} style={{ color: "inherit", fontSize: "0.8rem", textDecoration: "none" }}>Collections</a>
            <a href={`${context.homePath}/contact`} style={{ color: "inherit", fontSize: "0.8rem", textDecoration: "none" }}>Contact</a>
          </nav>
        </div>
      );

    case "footer-menus":
      return (
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, blocks.length || 3))}, minmax(0, 1fr))`, width: "100%" }}>
          {blocks.map((block) => (
            <BlockSlot key={block.id} section={section} block={block} flags={flags}>
              <div>
                <p style={{ margin: "0 0 0.7rem", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--s-muted, var(--t-muted))" }}>{settingString(block.settings, "heading")}</p>
                <div style={{ display: "grid", gap: 7 }}>
                  {settingString(block.settings, "links")
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [label, href = "/"] = line.split("|").map((part) => part.trim());
                      return (
                        <a key={line} href={resolveHref(href, context)} style={{ color: "inherit", fontSize: "0.8rem", textDecoration: "none" }}>{label}</a>
                      );
                    })}
                </div>
              </div>
            </BlockSlot>
          ))}
        </div>
      );

    case "footer-social":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--s-muted, var(--t-muted))" }}>{text(section, "heading", context, "Suis-nous")}</p>
          <SocialLinks settings={settings} context={context} />
        </div>
      );

    case "footer-payment":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <PaymentFooter settings={settings} context={context} />
          <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--s-muted, var(--t-muted))" }}>
            {bool(section, "showCopyright", true)
              ? text(section, "copyright", context) ||
                `© ${new Date().getFullYear()} ${context.storeName}`
              : ""}
          </p>
        </div>
      );

    case "custom-liquid":
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <pre style={{ marginTop: 14, overflow: "auto", borderRadius: 12, background: "color-mix(in srgb, var(--s-text) 6%, transparent)", padding: 14, fontSize: "0.75rem", color: "var(--s-muted, var(--t-muted))" }}>
            {text(section, "code", context)}
          </pre>
        </div>
      );

    case "custom-html":
      return (
        <div style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html: text(section, "code", context) }} />
      );

    case "app-block": {
      const app = context.appEmbeds?.find((entry) => entry.appId === text(section, "appId", context));
      return (
        <div style={{ width: "100%", borderRadius: 18, border: "1px dashed var(--s-border, var(--t-border))", padding: 20, textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{text(section, "heading", context) || app?.name || "Bloc d’application"}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "var(--s-muted, var(--t-muted))" }}>Le contenu de l’application s’affichera ici.</p>
        </div>
      );
    }

    case "product-gallery": {
      const images = context.productImages ?? [];
      return images.length > 0 ? (
        <ProductGallery images={images} name={context.product?.name ?? "Produit"} />
      ) : (
        <div style={{ width: "100%" }}>
          <Prose text="La galerie du produit apparaîtra ici. Choisis un produit dans l’aperçu." />
        </div>
      );
    }

    case "product-info":
      return <ProductInfo section={section} settings={settings} context={context} flags={flags} />;

    case "product-tabs":
      return <ProductTabs section={section} settings={settings} context={context} flags={flags} />;

    case "collection-banner": {
      const image = imageOf(section, context) ?? context.collection?.imageUrl ?? null;
      return (
        <div style={{ width: "100%" }}>
          {image ? <SmartImage src={image} alt={context.collection?.name ?? ""} ratio="21:9" radius={settings.mediaRadius} /> : null}
          <div style={{ marginTop: 18 }}>
            <SectionHeading eyebrow={text(section, "eyebrow", context)} heading={text(section, "heading", context, context.collection?.name ?? "Collection")} subheading={text(section, "subheading", context) || context.collection?.description || ""} />
          </div>
        </div>
      );
    }

    case "collection-grid": {
      const products = context.collection?.products ?? context.products;
      const cols = columns(section, 3);
      return (
        <div style={{ width: "100%" }}>
          {bool(section, "showFilters", true) || bool(section, "showSort", true) ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {bool(section, "showFilters", true) ? <span style={{ border: "1px solid var(--t-border)", borderRadius: 999, padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>Filtres</span> : null}
              {bool(section, "showSort", true) ? <span style={{ border: "1px solid var(--t-border)", borderRadius: 999, padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>Trier : En vedette</span> : null}
            </div>
          ) : null}
          <div style={grid(cols, settings.gridGapX)}>
            {products.map((product) => (
              <ProductCardView key={product.id} product={product} context={context} settings={settings} />
            ))}
          </div>
        </div>
      );
    }

    case "page-content":
      return (
        <div style={{ width: "100%", maxWidth: "var(--t-content-width)" }}>
          {bool(section, "showTitle", true) ? (
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>{context.page?.title ?? "Titre de la page"}</h1>
          ) : null}
          {bool(section, "showDate", false) && context.page?.publishedAt ? (
            <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--t-muted)" }}>{context.page.publishedAt}</p>
          ) : null}
          <div style={{ marginTop: 20 }}>
            {context.page?.content ? (
              <MarkdownBody markdown={context.page.content} />
            ) : (
              <Prose text="Le contenu de la page apparaîtra ici." />
            )}
          </div>
        </div>
      );

    case "blog-grid": {
      const posts = context.posts ?? [];
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          <div style={{ ...grid(columns(section, 3), settings.gridGapX), marginTop: 22 }}>
            {posts.map((post) => (
              <PostCardView key={post.id} post={post} context={context} settings={settings} />
            ))}
            {posts.length === 0 ? <p style={{ color: "var(--t-muted)", fontSize: "0.85rem" }}>Aucun article publié pour l’instant.</p> : null}
          </div>
        </div>
      );
    }

    case "article-content": {
      const article = context.article;
      return (
        <article style={{ width: "100%", maxWidth: "var(--t-content-width)" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>{article?.title ?? "Titre de l’article"}</h1>
          {bool(section, "showAuthor", true) || bool(section, "showDate", true) ? (
            <p style={{ margin: "0.7rem 0 0", fontSize: "0.78rem", color: "var(--t-muted)" }}>
              {bool(section, "showAuthor", true) ? article?.author ?? "" : ""}
              {bool(section, "showAuthor", true) && bool(section, "showDate", true) ? " · " : ""}
              {bool(section, "showDate", true) ? article?.publishedAt ?? "" : ""}
            </p>
          ) : null}
          {article?.imageUrl ? <div style={{ marginTop: 20 }}><SmartImage src={article.imageUrl} alt={article.title} ratio="16:9" radius={settings.mediaRadius} /></div> : null}
          <div style={{ marginTop: 22 }}>
            {article?.content ? (
              <MarkdownBody markdown={article.content} />
            ) : (
              <Prose text="Le contenu de l’article apparaîtra ici." />
            )}
          </div>
        </article>
      );
    }

    case "search-results": {
      const search = context.search;
      return (
        <div style={{ width: "100%" }}>
          <SectionHeading heading={search?.query ? `Résultats pour « ${search.query} »` : text(section, "heading", context, "Recherche")} subheading={`${search?.results.length ?? 0} produit(s)`} />
          <form action={`${context.homePath}/search`} method="get" style={{ display: "flex", gap: 8, marginTop: 16, maxWidth: 620, flexWrap: "wrap" }}>
            <input
              name="q"
              defaultValue={search?.query ?? ""}
              placeholder="Rechercher un produit…"
              aria-label="Rechercher"
              style={{ minHeight: 46, flex: "1 1 220px", borderRadius: 999, border: "1px solid var(--t-border)", padding: "0 1rem", background: "transparent", color: "inherit" }}
            />
            <button type="submit" style={{ minHeight: 46, borderRadius: 999, border: 0, padding: "0 1.3rem", background: "var(--t-btn-bg)", color: "var(--t-btn-text)", fontWeight: 700 }}>
              Rechercher
            </button>
          </form>
          <div style={{ ...grid(columns(section, 3), settings.gridGapX), marginTop: 22 }}>
            {(search?.results ?? context.products).map((product) => (
              <ProductCardView key={product.id} product={product} context={context} settings={settings} />
            ))}
          </div>
          {search && search.results.length === 0 ? <p style={{ marginTop: 20, color: "var(--t-muted)" }}>{text(section, "emptyText", context) || search.emptyText}</p> : null}
        </div>
      );
    }

    case "cart-items": {
      const cart = context.cart;
      return (
        <div style={{ width: "100%", maxWidth: 860 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>{text(section, "heading", context, "Ton panier")}</h1>
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {(cart?.lines ?? []).map((line) => (
              <div key={line.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 12, alignItems: "center", borderBottom: "1px solid var(--t-border)", paddingBottom: 12 }}>
                <SmartImage src={line.imageUrl} alt={line.name} ratio="1:1" radius={10} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{line.name}</p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--t-muted)" }}>Quantité : {line.quantity}</p>
                </div>
                <p style={{ margin: 0, fontWeight: 700 }}>{line.priceLabel}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>Sous-total : {cart?.subtotalLabel ?? money(0, context)}</p>
            <CtaLink label={text(section, "buttonLabel", context, "Passer à la caisse")} href="/checkout" context={context} />
          </div>
        </div>
      );
    }

    case "not-found":
      return (
        <div style={{ width: "100%", textAlign: "center", paddingBlock: 40 }}>
          <p style={{ margin: 0, fontSize: "4rem", fontWeight: 800, color: "var(--s-accent, var(--t-accent))" }}>404</p>
          <SectionHeading heading={text(section, "heading", context, "Cette page a disparu")} subheading={text(section, "text", context) || text(section, "subheading", context)} align="center" />
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <CtaLink label={text(section, "buttonLabel", context, "Retour à la boutique")} href={text(section, "buttonLink", context, "/")} context={context} />
            <CtaLink label={text(section, "buttonLabel2", context)} href={text(section, "buttonLink2", context)} context={context} secondary />
          </div>
        </div>
      );

    case "password-form":
      return (
        <div style={{ width: "100%", maxWidth: 520, marginInline: "auto", textAlign: "center" }}>
          <SectionHeading heading={text(section, "heading", context, "Bientôt en ligne")} subheading={text(section, "text", context) || text(section, "subheading", context)} align="center" />
          <form style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }} onSubmit={(event) => event.preventDefault()}>
            <input type="email" required placeholder="ton@email.com" style={{ minHeight: 46, flex: "1 1 220px", borderRadius: 999, border: "1px solid var(--t-border)", padding: "0 1rem", background: "transparent", color: "inherit" }} />
            <button type="submit" style={{ minHeight: 46, borderRadius: 999, border: 0, padding: "0 1.2rem", background: "var(--t-btn-bg)", color: "var(--t-btn-text)", fontWeight: 700 }}>{text(section, "buttonLabel", context, "Entrer")}</button>
          </form>
        </div>
      );

    default:
      return (
        <div style={{ width: "100%" }}>
          {headingBlock}
          {text(section, "text", context) ? <Prose text={text(section, "text", context)} /> : null}
        </div>
      );
  }
}

export { SectionRenderer as default };
