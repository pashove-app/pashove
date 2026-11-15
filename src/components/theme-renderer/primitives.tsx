"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeSettings } from "@/lib/theme-editor/types";
import { cn } from "@/lib/cn";
import { Icon, icons } from "@/components/ui/primitives";
import { cardStyle, fontFamily, settingBoolean, settingNumber, settingString } from "@/components/theme-renderer/style";
import type {
  ThemeCollectionCard,
  ThemePostCard,
  ThemeProductCard,
  ThemeRenderContext,
} from "@/components/theme-renderer/context";

export function resolveHref(href: string, context: ThemeRenderContext): string {
  const value = href.trim();
  if (!value) return context.homePath;
  if (
    value.startsWith("http") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#")
  ) {
    return value;
  }
  if (value.startsWith(context.homePath)) return value;
  return `${context.homePath}${value.startsWith("/") ? value : `/${value}`}`;
}

export function SmartImage({
  src,
  alt,
  ratio = "auto",
  fit = "cover",
  radius,
  className,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: string;
  fit?: "cover" | "contain" | "fill";
  radius?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const aspect =
    ratio === "1:1"
      ? "1 / 1"
      : ratio === "4:5"
        ? "4 / 5"
        : ratio === "4:3"
          ? "4 / 3"
          : ratio === "16:9"
            ? "16 / 9"
            : undefined;

  if (!src) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-black/5 text-xs",
          className,
        )}
        style={{
          aspectRatio: aspect,
          borderRadius: radius ? `${radius}px` : "var(--t-radius)",
          color: "var(--t-muted)",
          ...style,
        }}
      >
        Image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("w-full", className)}
      style={{
        aspectRatio: aspect,
        objectFit: fit,
        borderRadius: radius ? `${radius}px` : "var(--t-radius)",
        ...style,
      }}
    />
  );
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "left",
}: {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  align?: string;
}) {
  if (!eyebrow && !heading && !subheading) return null;

  return (
    <div
      style={{
        textAlign: align as CSSProperties["textAlign"],
        maxWidth: "62ch",
        marginLeft: align === "center" ? "auto" : undefined,
        marginRight: align === "center" ? "auto" : undefined,
        color: "var(--s-text, var(--t-text))",
      }}
    >
      {eyebrow ? (
        <p
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--s-accent, var(--t-accent))",
            marginBottom: "0.75rem",
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      {heading ? (
        <h2
          style={{
            fontFamily: "var(--s-heading-font, inherit)",
            fontSize: "clamp(1.75rem, 3.2vw, var(--s-heading-size, 2.5rem))",
            fontWeight: "var(--s-heading-weight, 600)" as CSSProperties["fontWeight"],
            lineHeight: "var(--s-heading-line, 1.1)",
            letterSpacing: "var(--s-heading-tracking, 0)",
            textTransform: "var(--s-heading-case, none)" as CSSProperties["textTransform"],
            margin: 0,
          }}
        >
          {heading}
        </h2>
      ) : null}
      {subheading ? (
        <p
          style={{
            margin: "0.9rem 0 0",
            color: "var(--s-muted, var(--t-muted))",
            fontSize: "var(--s-body-size, 1rem)",
            lineHeight: 1.65,
          }}
        >
          {subheading}
        </p>
      ) : null}
    </div>
  );
}

export function CtaLink({
  label,
  href,
  context,
  secondary = false,
  className,
}: {
  label: string;
  href: string;
  context: ThemeRenderContext;
  secondary?: boolean;
  className?: string;
}) {
  if (!label) return null;
  const target = resolveHref(href, context);
  const external = target.startsWith("http");

  const style: CSSProperties = secondary
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: "0 1.35rem",
        borderRadius: "999px",
        border: "1px solid var(--s-border, var(--t-border))",
        color: "var(--s-text, var(--t-text))",
        fontWeight: 600,
        fontSize: "0.875rem",
        textDecoration: "none",
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: "0 1.5rem",
        borderRadius: "999px",
        background: "var(--s-btn-bg, var(--t-btn-bg))",
        color: "var(--s-btn-text, var(--t-btn-text))",
        fontWeight: 600,
        fontSize: "0.875rem",
        textDecoration: "none",
        boxShadow: "0 10px 24px -14px rgb(0 0 0 / 0.55)",
      };

  const labelNode = <span style={style} className={className}>{label}</span>;

  if (external) {
    return (
      <a href={target} target="_blank" rel="noreferrer">
        {labelNode}
      </a>
    );
  }

  return <Link href={target}>{labelNode}</Link>;
}

export function ProductCardView({
  product,
  context,
  settings,
  showPrice = true,
  showVendor = false,
  showBadge = true,
}: {
  product: ThemeProductCard;
  context: ThemeRenderContext;
  settings: ThemeSettings;
  showPrice?: boolean;
  showVendor?: boolean;
  showBadge?: boolean;
}) {
  const ratio =
    settings.productCard.imageRatio === "square"
      ? "1:1"
      : settings.productCard.imageRatio === "landscape"
        ? "4:3"
        : settings.productCard.imageRatio === "adapt"
          ? "auto"
          : "4:5";
  const badge = product.badge ?? (product.discountPercent ? `-${product.discountPercent}%` : null);
  const badgeStyle = settings.productCard.badgeStyle;

  return (
    <Link
      href={`${context.homePath}/products/${product.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
      className="group"
    >
      <div style={{ ...cardStyle(settings), position: "relative" }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <SmartImage
            src={product.imageUrl}
            alt={product.name}
            ratio={ratio}
            radius={0}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ background: "color-mix(in srgb, var(--t-text) 6%, transparent)" }}
          />
          {showBadge && badge ? (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: settings.badgePosition === "top-left" ? 10 : undefined,
                right: settings.badgePosition === "top-right" ? 10 : undefined,
                background: "var(--t-promo)",
                color: "#fff",
                borderRadius: badgeStyle === "square" ? 6 : 999,
                padding: "0.25rem 0.6rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div style={{ padding: "0.8rem 0.9rem 0.95rem" }}>
          {showVendor && product.vendor ? (
            <p style={{ fontSize: "0.6875rem", color: "var(--t-muted)", margin: 0 }}>
              {product.vendor}
            </p>
          ) : null}
          <p
            style={{
              margin: "0.15rem 0 0",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--t-text)",
              lineHeight: 1.35,
            }}
          >
            {product.name}
          </p>
          {showPrice ? (
            <p style={{ margin: "0.4rem 0 0", display: "flex", gap: "0.45rem", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--t-text)" }}>
                {product.priceLabel}
              </span>
              {product.compareAtLabel ? (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--t-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  {product.compareAtLabel}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function CollectionCardView({
  collection,
  context,
  settings,
}: {
  collection: ThemeCollectionCard;
  context: ThemeRenderContext;
  settings: ThemeSettings;
}) {
  return (
    <Link
      href={`${context.homePath}/collections/${collection.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
      className="group"
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: `${settings.collectionCardRadius}px`,
          boxShadow: settings.collectionCardShadow
            ? "0 14px 34px -22px rgb(0 0 0 / 0.45)"
            : undefined,
        }}
      >
        <SmartImage
          src={collection.imageUrl}
          alt={collection.name}
          ratio="4:3"
          radius={settings.collectionCardRadius}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgb(0 0 0 / 0.55), transparent 60%)",
          }}
        />
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, color: "#fff" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{collection.name}</p>
          {settings.collectionCardShowCount ? (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", opacity: 0.8 }}>
              {collection.productCount} produit{collection.productCount > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function PostCardView({
  post,
  context,
  settings,
}: {
  post: ThemePostCard;
  context: ThemeRenderContext;
  settings: ThemeSettings;
}) {
  return (
    <Link
      href={`${context.homePath}/blog/${post.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
      className="group"
    >
      <div
        style={{
          overflow: "hidden",
          borderRadius: `${settings.articleCardRadius}px`,
          border: "1px solid var(--t-border)",
        }}
      >
        <SmartImage src={post.imageUrl} alt={post.title} ratio="16:9" radius={0} />
        <div style={{ padding: "1rem" }}>
          {settings.articleCardShowDate && post.publishedAt ? (
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--t-muted)" }}>
              {post.publishedAt}
            </p>
          ) : null}
          <p style={{ margin: "0.3rem 0 0", fontSize: "1rem", fontWeight: 700, color: "var(--t-text)" }}>
            {post.title}
          </p>
          {settings.articleCardShowExcerpt && post.excerpt ? (
            <p style={{ margin: "0.45rem 0 0", fontSize: "0.8125rem", color: "var(--t-muted)", lineHeight: 1.6 }}>
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2, color: "var(--s-accent, var(--t-accent))" }} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ opacity: index < rating ? 1 : 0.25, display: "inline-flex" }}>
          <Icon path={icons.star} className="h-3.5 w-3.5" />
        </span>
      ))}
    </div>
  );
}

export function HeadingStyle({
  fontSize = 40,
  children,
  as: Tag = "h2",
  className,
}: {
  fontSize?: number;
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
}) {
  return (
    <Tag
      className={className}
      style={{
        fontFamily: "var(--s-heading-font, inherit)",
        fontSize: `clamp(1.5rem, 3vw, ${fontSize}px)`,
        fontWeight: 600,
        lineHeight: "var(--s-heading-line, 1.1)",
        letterSpacing: "var(--s-heading-tracking, 0)",
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

export function Prose({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return (
    <div
      style={{
        color: "var(--s-muted, var(--t-muted))",
        fontSize: "var(--s-body-size, 1rem)",
        lineHeight: 1.7,
        display: "grid",
        gap: "0.75rem",
      }}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ margin: 0 }}>{paragraph}</p>
      ))}
    </div>
  );
}

export function useGridColumns(settings: Record<string, unknown>, fallback = 3): number {
  return settingNumber(settings as never, "columnsDesktop", fallback);
}

export function gridStyle(columns: number, gap: number): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, columns))}, minmax(0, 1fr))`,
    gap: `${gap}px`,
    width: "100%",
  };
}

export function fontOf(settings: ThemeSettings, key: string): string {
  return fontFamily(settingString({}, key, settings.bodyFont));
}

export function optionRatio(value: string): string {
  return value === "16:9" ? "16 / 9" : value === "1:1" ? "1 / 1" : value === "4:5" ? "4 / 5" : "4 / 3";
}

export function isOn(settings: Record<string, unknown>, key: string, fallback = false): boolean {
  return settingBoolean(settings as never, key, fallback);
}
