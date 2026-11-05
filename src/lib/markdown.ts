function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(raw: string): string {
  const href = raw.trim();
  if (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("/") ||
    href.startsWith("#")
  ) {
    return escapeHtml(href);
  }
  return "#";
}

/** Gras, italique, code et liens, sur du texte déjà échappé. */
function inline(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${safeHref(href)}" rel="noopener noreferrer">${label}</a>`,
  );

  return html;
}

/**
 * Rendu Markdown minimal et sûr : titres, listes, citations et paragraphes.
 * Le HTML est échappé avant toute transformation, donc aucun script ne passe.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      output.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      output.push(
        `<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`,
      );
      list = [];
    }
  }

  function flushQuote() {
    if (quote.length > 0) {
      output.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
      quote = [];
    }
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushAll();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      list.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();
  return output.join("\n");
}
