export const NOTE_LINK_CLASS = "break-all text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 hover:decoration-blue-700";

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;

const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"]);
const TAG_ALIASES: Record<string, string> = { b: "strong", i: "em", div: "p" };
const VOID_TAGS = new Set(["br"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "noscript", "template", "object", "embed"]);
// Wrappers that carry formatting only as inline CSS. Pasted Word and Google Docs content is full of
// them, and execCommand emits them too whenever styleWithCSS is on.
const UNWRAP_KEEPING_STYLE = new Set(["span", "font"]);
const STYLE_TAG_RULES: { pattern: RegExp; tag: string }[] = [
  { pattern: /font-weight\s*:\s*(bold(er)?|[6-9]00)/i, tag: "strong" },
  { pattern: /font-style\s*:\s*italic/i, tag: "em" },
  { pattern: /text-decoration(-line)?\s*:[^;]*underline/i, tag: "u" }
];

/** Notes were plain text before rich text landed, so stored values can still be either. */
export function isLikelyNotesHtml(value: string) {
  return /<\/?[a-z][^>]*>/i.test(value);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Turns a legacy plain-text note into the paragraph-and-link markup the editor now renders. */
export function plainTextToNotesHtml(value: string) {
  if (!value.trim()) return "";

  return value.split(/\n{2,}/).map((block) => {
    const lines = block.split("\n").map((line) => linkifyPlainText(line)).join("<br>");
    return `<p>${lines}</p>`;
  }).join("");
}

export function linkifyPlainText(value: string) {
  return value.split(URL_PATTERN).map((part) => {
    const escaped = escapeHtml(part);
    if (!/^https?:\/\//.test(part)) return escaped;
    return `<a href="${escaped}" target="_blank" rel="noreferrer" class="${NOTE_LINK_CLASS}">${escaped}</a>`;
  }).join("");
}

/** Accepts either storage format and returns markup that is safe to assign to innerHTML. */
export function renderNotesHtml(value: string | null | undefined) {
  const raw = value ?? "";
  if (!raw.trim()) return "";
  return isLikelyNotesHtml(raw) ? sanitizeNotesHtml(raw) : plainTextToNotesHtml(raw);
}

/**
 * Allowlist sanitizer. Every attribute is dropped except a validated http(s) href, so the tag
 * allowlist is the whole surface. Pure string work on purpose: the same function has to run in the
 * browser and in the Cloudflare Workers runtime, which has no DOMParser.
 */
export function sanitizeNotesHtml(value: string) {
  const withoutDroppedBlocks = Array.from(DROP_WITH_CONTENT).reduce(
    (html, tag) => html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "").replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), ""),
    value
  );

  // Unwrap a link with an unusable href as a pair, so no orphan closing tag is left behind.
  const withCheckedLinks = withoutDroppedBlocks.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,
    (fullMatch, rawAttributes: string, inner: string) => (readHref(rawAttributes) ? fullMatch : inner)
  );

  // A stack, not a regex pass, because style-only wrappers nest and each closing tag has to emit
  // exactly the tags its opener produced.
  const styleWrapperStack: string[][] = [];

  const cleaned = withCheckedLinks.split(/(<[^>]*>)/g).map((token) => {
    if (!token.startsWith("<")) return token;

    const match = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)(\/?)\s*>$/.exec(token);
    if (!match) return "";

    const [, closingSlash, rawName, rawAttributes, selfClosingSlash] = match;
    const lowerName = rawName.toLowerCase();

    if (UNWRAP_KEEPING_STYLE.has(lowerName)) {
      if (selfClosingSlash) return "";
      if (closingSlash) return (styleWrapperStack.pop() ?? []).reverse().map((tag) => `</${tag}>`).join("");
      const tags = lowerName === "span" ? readStyleTags(rawAttributes) : [];
      styleWrapperStack.push(tags);
      return tags.map((tag) => `<${tag}>`).join("");
    }

    const name = TAG_ALIASES[lowerName] ?? lowerName;
    if (!ALLOWED_TAGS.has(name)) return "";

    if (VOID_TAGS.has(name)) return closingSlash ? "" : `<${name}>`;
    if (closingSlash) return `</${name}>`;

    if (name === "a") {
      const href = readHref(rawAttributes);
      if (!href) return "";
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" class="${NOTE_LINK_CLASS}">`;
    }

    return `<${name}>`;
  }).join("");

  return normaliseListWrappers(cleaned);
}

/**
 * Browsers wrap a list turned on inside a paragraph as `<p><ul>...</ul></p>`, which reparses into two
 * empty paragraphs around the list and shows up as blank gaps. Unwrap it so storage stays clean.
 */
function normaliseListWrappers(html: string) {
  return html
    .replace(/<p>\s*(<(?:ul|ol)>)/gi, "$1")
    .replace(/(<\/(?:ul|ol)>)\s*<\/p>/gi, "$1")
    .replace(/<p>\s*<\/p>\s*(<(?:ul|ol)>)/gi, "$1")
    .replace(/(<\/(?:ul|ol)>)\s*<p>\s*<\/p>/gi, "$1");
}

function readStyleTags(rawAttributes: string) {
  const match = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(rawAttributes);
  const style = match?.[2] ?? match?.[3] ?? "";
  if (!style) return [];
  return STYLE_TAG_RULES.filter((rule) => rule.pattern.test(style)).map((rule) => rule.tag);
}

function readHref(rawAttributes: string) {
  const match = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(rawAttributes);
  const href = (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
  return /^https?:\/\//i.test(href) ? href : "";
}

/** Used wherever a note has to travel as plain text, such as the roadmap handoff. */
export function notesHtmlToPlainText(value: string | null | undefined) {
  const raw = value ?? "";
  if (!raw.trim()) return "";
  if (!isLikelyNotesHtml(raw)) return raw.trim();

  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|ul|ol|h[1-6]|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** True when the note carries no visible characters, so blank markup is stored as an empty note. */
export function isEmptyNotesHtml(value: string) {
  return !notesHtmlToPlainText(value).trim();
}
