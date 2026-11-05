"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { BlockCopy } from "@/lib/theme/copy";
import type { ThemeBlock, ThemeBlockItem, ThemeBlockType } from "@/lib/theme/types";

const TYPES: ThemeBlockType[] = [
  "text",
  "image",
  "video",
  "newsletter",
  "faq",
  "testimonials",
];

function emptyBlock(type: ThemeBlockType): ThemeBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    enabled: true,
    title: "",
    body: "",
    imageUrl: "",
    videoUrl: "",
    ctaLabel: "",
    ctaHref: "",
    items: [],
  };
}

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
    "mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2 text-[0.8125rem] text-fg outline-none transition-colors placeholder:text-faint focus:border-brand-500";

  return (
    <label className="block">
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
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

export function BlockEditor({
  blocks,
  onChange,
  copy,
}: {
  blocks: ThemeBlock[];
  onChange: (blocks: ThemeBlock[]) => void;
  copy: BlockCopy;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function patch(index: number, patchValue: Partial<ThemeBlock>) {
    onChange(
      blocks.map((block, i) => (i === index ? { ...block, ...patchValue } : block)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function drop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  function patchItem(index: number, itemIndex: number, item: Partial<ThemeBlockItem>) {
    patch(index, {
      items: blocks[index].items.map((entry, i) =>
        i === itemIndex ? { ...entry, ...item } : entry,
      ),
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">{copy.title}</h2>
          {blocks.length === 0 ? (
            <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
              {copy.empty}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...blocks, emptyBlock(type)])}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[0.6875rem] font-medium text-subtle transition-colors hover:border-brand-500 hover:text-accent"
          >
            <Icon path={icons.plus} className="h-3 w-3" strokeWidth={2} />
            {copy.types[type]}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(index)}
            className="rounded-2xl border border-border bg-bg p-3.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                title={copy.drag}
                className="cursor-grab text-faint active:cursor-grabbing"
              >
                ⋮⋮
              </span>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-accent">
                {copy.types[block.type]}
              </span>
              <input
                type="checkbox"
                checked={block.enabled}
                onChange={(event) => patch(index, { enabled: event.target.checked })}
                aria-label={copy.enabled}
                className="h-4 w-4 accent-brand-500"
              />
              <span className="text-[0.6875rem] text-faint">{copy.enabled}</span>
              <span className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={copy.up}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  aria-label={copy.down}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(blocks.filter((_, i) => i !== index))}
                  aria-label={copy.remove}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10"
                >
                  <Icon path={icons.trash} className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label={copy.blockTitle}
                value={block.title}
                onChange={(value) => patch(index, { title: value })}
              />

              {block.type === "image" ? (
                <Field
                  label={copy.imageUrl}
                  value={block.imageUrl}
                  onChange={(value) => patch(index, { imageUrl: value })}
                  placeholder="https://…"
                />
              ) : null}

              {block.type === "video" ? (
                <Field
                  label={copy.videoUrl}
                  value={block.videoUrl}
                  onChange={(value) => patch(index, { videoUrl: value })}
                  placeholder="https://…/video.mp4"
                />
              ) : null}

              {block.type !== "faq" && block.type !== "testimonials" ? (
                <div className="sm:col-span-2">
                  <Field
                    label={copy.body}
                    value={block.body}
                    onChange={(value) => patch(index, { body: value })}
                    textarea
                  />
                </div>
              ) : null}

              {block.type === "text" ||
              block.type === "image" ||
              block.type === "newsletter" ? (
                <>
                  <Field
                    label={copy.ctaLabel}
                    value={block.ctaLabel}
                    onChange={(value) => patch(index, { ctaLabel: value })}
                  />
                  <Field
                    label={copy.ctaHref}
                    value={block.ctaHref}
                    onChange={(value) => patch(index, { ctaHref: value })}
                    placeholder="/fr/store/…/pages/contact"
                  />
                </>
              ) : null}
            </div>

            {block.type === "faq" || block.type === "testimonials" ? (
              <div className="mt-3 border-t border-hairline pt-3">
                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-faint">
                  {copy.items}
                </p>
                <div className="mt-2 space-y-2">
                  {block.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="grid gap-2 rounded-xl border border-border p-2.5 sm:grid-cols-2"
                    >
                      <Field
                        label={copy.itemTitle}
                        value={item.title}
                        onChange={(value) =>
                          patchItem(index, itemIndex, { title: value })
                        }
                      />
                      <Field
                        label={block.type === "testimonials" ? copy.itemAuthor : copy.itemText}
                        value={block.type === "testimonials" ? item.author ?? "" : item.text}
                        onChange={(value) =>
                          patchItem(
                            index,
                            itemIndex,
                            block.type === "testimonials"
                              ? { author: value }
                              : { text: value },
                          )
                        }
                      />
                      {block.type === "testimonials" ? (
                        <div className="sm:col-span-2">
                          <Field
                            label={copy.itemText}
                            value={item.text}
                            onChange={(value) =>
                              patchItem(index, itemIndex, { text: value })
                            }
                            textarea
                          />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          patch(index, {
                            items: block.items.filter((_, i) => i !== itemIndex),
                          })
                        }
                        className="justify-self-start text-[0.6875rem] font-medium text-red-500 hover:underline"
                      >
                        {copy.removeItem}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patch(index, {
                      items: [...block.items, { title: "", text: "", author: "" }],
                    })
                  }
                  className="mt-2 text-[0.6875rem] font-medium text-accent hover:underline"
                >
                  + {copy.addItem}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
