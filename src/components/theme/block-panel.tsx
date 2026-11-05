"use client";

import { Icon, icons } from "@/components/ui/primitives";
import type { BlockCopy } from "@/lib/theme/copy";
import type { ThemeBlock, ThemeBlockItem } from "@/lib/theme/types";

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  const className =
    "mt-1 w-full rounded-lg border border-[#d9d9de] bg-white px-2.5 py-2 text-[12px] text-[#1d1d1f] outline-none transition-colors placeholder:text-[#9a9aa2] focus:border-[#2f5cff]";

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#77777f]">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

export function BlockPanel({
  block,
  copy,
  onChange,
  onBack,
  onDelete,
}: {
  block: ThemeBlock;
  copy: BlockCopy;
  onChange: (patch: Partial<ThemeBlock>) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  function item(index: number, patch: Partial<ThemeBlockItem>) {
    onChange({
      items: block.items.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    });
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#e5e5e8] bg-white px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#5f5f66] hover:bg-[#f1f1f3]"
        >
          <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rotate-180" strokeWidth={1.8} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#1d1d1f]">
            {copy.types[block.type]}
          </p>
          <p className="text-[10px] text-[#8a8a92]">{copy.blockTitle}</p>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] text-[#66666e]">
          <input
            type="checkbox"
            checked={block.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
            className="h-3.5 w-3.5 accent-[#2f5cff]"
          />
          {copy.enabled}
        </label>
        <button
          type="button"
          onClick={onDelete}
          aria-label={copy.remove}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#c24141] hover:bg-[#fef2f2]"
        >
          <Icon path={icons.trash} className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <Field
          label={copy.blockTitle}
          value={block.title}
          onChange={(value) => onChange({ title: value })}
        />

        {block.type === "image" ? (
          <Field
            label={copy.imageUrl}
            value={block.imageUrl}
            onChange={(value) => onChange({ imageUrl: value })}
            placeholder="https://…"
          />
        ) : null}

        {block.type === "video" ? (
          <Field
            label={copy.videoUrl}
            value={block.videoUrl}
            onChange={(value) => onChange({ videoUrl: value })}
            placeholder="https://…/video.mp4"
          />
        ) : null}

        {block.type !== "faq" && block.type !== "testimonials" ? (
          <Field
            label={copy.body}
            value={block.body}
            onChange={(value) => onChange({ body: value })}
            textarea
          />
        ) : null}

        {block.type === "text" ||
        block.type === "image" ||
        block.type === "newsletter" ? (
          <>
            <Field
              label={copy.ctaLabel}
              value={block.ctaLabel}
              onChange={(value) => onChange({ ctaLabel: value })}
            />
            <Field
              label={copy.ctaHref}
              value={block.ctaHref}
              onChange={(value) => onChange({ ctaHref: value })}
              placeholder="/fr/store/…/pages/contact"
            />
          </>
        ) : null}

        {block.type === "faq" || block.type === "testimonials" ? (
          <div className="space-y-3 border-t border-[#ededf0] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#77777f]">
              {copy.items}
            </p>

            {block.items.map((entry, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-[#e5e5e8] bg-[#fafafa] p-2.5"
              >
                <Field
                  label={copy.itemTitle}
                  value={entry.title}
                  onChange={(value) => item(index, { title: value })}
                />
                {block.type === "testimonials" ? (
                  <Field
                    label={copy.itemAuthor}
                    value={entry.author ?? ""}
                    onChange={(value) => item(index, { author: value })}
                  />
                ) : null}
                <Field
                  label={copy.itemText}
                  value={entry.text}
                  onChange={(value) => item(index, { text: value })}
                  textarea
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                  className="text-[10px] font-medium text-[#c24141] hover:underline"
                >
                  {copy.removeItem}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                onChange({
                  items: [...block.items, { title: "", text: "", author: "" }],
                })
              }
              className="text-[11px] font-medium text-[#2f5cff] hover:underline"
            >
              + {copy.addItem}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
