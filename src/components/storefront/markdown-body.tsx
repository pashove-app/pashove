import { markdownToHtml } from "@/lib/markdown";

/** Corps Markdown rendu avec les styles de la vitrine. */
export function MarkdownBody({
  markdown,
  className = "",
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={`prose-storefront ${className}`}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
    />
  );
}
