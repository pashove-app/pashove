import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import type { ThemeBlock } from "@/lib/theme/types";

function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function Cta({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  if (!label || !href) return null;

  return (
    <Link
      href={href}
      className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
    >
      {label}
      <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2} />
    </Link>
  );
}

function Video({ url }: { url: string }) {
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );

  if (youtube) {
    return (
      <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtube[1]}`}
          title="Vidéo de la boutique"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      playsInline
      className="mt-5 aspect-video w-full rounded-2xl border border-border bg-black object-cover"
    />
  );
}

export function ThemeBlocks({
  blocks,
}: {
  blocks: ThemeBlock[];
}) {
  const visible = blocks.filter((block) => block.enabled);
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((block) => {
        if (block.type === "image") {
          return (
            <section
              key={block.id}
              className="overflow-hidden rounded-3xl border border-border bg-surface"
            >
              {block.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={block.imageUrl}
                  alt={block.title}
                  className="max-h-[480px] w-full object-cover"
                />
              ) : null}
              <div className="p-6 sm:p-8">
                {block.title ? (
                  <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                    {block.title}
                  </h2>
                ) : null}
                {block.body ? (
                  <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
                    {paragraphs(block.body).map((part, index) => (
                      <p key={index}>{part}</p>
                    ))}
                  </div>
                ) : null}
                <Cta label={block.ctaLabel} href={block.ctaHref} />
              </div>
            </section>
          );
        }

        if (block.type === "video") {
          return (
            <section key={block.id}>
              {block.title ? (
                <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                  {block.title}
                </h2>
              ) : null}
              <Video url={block.videoUrl} />
              {block.body ? (
                <div className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
                  {paragraphs(block.body).map((part, index) => (
                    <p key={index}>{part}</p>
                  ))}
                </div>
              ) : null}
              <Cta label={block.ctaLabel} href={block.ctaHref} />
            </section>
          );
        }

        if (block.type === "faq") {
          return (
            <section
              key={block.id}
              className="rounded-3xl border border-border bg-surface p-6 sm:p-8"
            >
              <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                {block.title || "FAQ"}
              </h2>
              <div className="mt-5 divide-y divide-hairline">
                {block.items.map((item, index) => (
                  <details key={index} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-medium text-fg">
                      {item.title}
                      <Icon
                        path={icons.chevronDown}
                        className="h-4 w-4 shrink-0 text-faint transition-transform group-open:rotate-180"
                        strokeWidth={1.8}
                      />
                    </summary>
                    <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-muted">
                      {item.text}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "testimonials") {
          return (
            <section key={block.id}>
              <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                {block.title || "Témoignages"}
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {block.items.map((item, index) => (
                  <figure
                    key={index}
                    className="rounded-3xl border border-border bg-surface p-5"
                  >
                    <div className="flex gap-1 text-brand-500">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Icon
                          key={star}
                          path={icons.sparkle}
                          className="h-3.5 w-3.5"
                          strokeWidth={1.8}
                        />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-[0.875rem] leading-relaxed text-body">
                      “{item.text}”
                    </blockquote>
                    <figcaption className="mt-4 text-[0.75rem] font-medium text-subtle">
                      {item.title}
                      {item.author ? ` · ${item.author}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "newsletter") {
          return (
            <section
              key={block.id}
              className="rounded-3xl border border-border bg-gradient-to-br from-brand-500/12 to-transparent p-6 sm:p-8"
            >
              <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                {block.title || "Newsletter"}
              </h2>
              {block.body ? (
                <div className="mt-3 max-w-2xl space-y-3 text-[0.9375rem] leading-relaxed text-muted">
                  {paragraphs(block.body).map((part, index) => (
                    <p key={index}>{part}</p>
                  ))}
                </div>
              ) : null}
              <Cta label={block.ctaLabel || "S’inscrire"} href={block.ctaHref || "#"} />
            </section>
          );
        }

        return (
          <section key={block.id}>
            {block.title ? (
              <h2 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.875rem]">
                {block.title}
              </h2>
            ) : null}
            {block.body ? (
              <div className="mt-3 max-w-3xl space-y-3 text-[0.9375rem] leading-7 text-muted">
                {paragraphs(block.body).map((part, index) => (
                  <p key={index}>{part}</p>
                ))}
              </div>
            ) : null}
            <Cta label={block.ctaLabel} href={block.ctaHref} />
          </section>
        );
      })}
    </>
  );
}
