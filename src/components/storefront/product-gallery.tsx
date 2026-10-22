"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * Galerie de la fiche produit : une image principale, quatre miniatures.
 * Sur mobile, les miniatures passent sous l'image en défilement horizontal.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface text-faint">
        <Icon path={icons.tag} className="h-8 w-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {images.length > 1 ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:w-20 sm:flex-col sm:overflow-visible sm:pb-0">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${name} — ${index + 1}`}
              aria-current={active === index ? "true" : undefined}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border bg-hairline transition-colors sm:w-full",
                active === index
                  ? "border-fg"
                  : "border-border hover:border-border-strong",
              )}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative order-1 aspect-square flex-1 overflow-hidden rounded-2xl border border-border bg-hairline sm:order-2">
        <Image
          src={images[active]}
          alt={name}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
