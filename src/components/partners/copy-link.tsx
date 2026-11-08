"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";

export function CopyLink({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-bg p-3">
      <p className="break-all font-mono text-[0.6875rem] leading-relaxed text-subtle">
        {url}
      </p>
      <button
        type="button"
        onClick={copy}
        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[0.6875rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
      >
        <Icon
          path={copied ? icons.check : icons.paperclip}
          className="h-3.5 w-3.5"
          strokeWidth={2}
        />
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
