/**
 * Browser-side HTML sanitizer used by the rich text editor.
 *
 * Mirrors the allowlist enforced by the backend (`utils/sanitizeHtml.js`) so
 * what the admin sees while editing is exactly what gets stored and rendered
 * on the public site. Primarily guards pasted content from Word / web pages.
 */

// tag name -> allowed attributes
export const ALLOWED_TAGS = {
  P: [],
  BR: [],
  STRONG: [],
  B: [],
  EM: [],
  I: [],
  U: [],
  S: [],
  STRIKE: [],
  SUB: [],
  SUP: [],
  UL: [],
  OL: [],
  LI: [],
  H1: [],
  H2: [],
  H3: [],
  H4: [],
  H5: [],
  H6: [],
  BLOCKQUOTE: [],
  SPAN: [],
  DIV: [],
  A: ["href", "target", "rel"],
};

// Elements dropped together with their contents.
const DROP_WITH_CONTENT = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE",
  "SVG", "MATH", "LINK", "META", "FORM", "INPUT", "BUTTON", "TEXTAREA",
  "SELECT", "OPTION", "IMG", "VIDEO", "AUDIO", "TABLE",
]);

const isSafeHref = (value) => {
  const normalized = String(value)
    .split("")
    .filter((ch) => ch.charCodeAt(0) > 32)
    .join("")
    .toLowerCase();
  return !/^(javascript|vbscript|data|file):/.test(normalized);
};

const cleanElement = (el) => {
  // Walk a static copy — we mutate the tree as we go.
  for (const child of Array.from(el.children)) {
    const tag = child.tagName.toUpperCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      child.remove();
      continue;
    }

    cleanElement(child);

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TAGS, tag)) {
      // Not allowed, but its text is worth keeping — unwrap it.
      child.replaceWith(...Array.from(child.childNodes));
      continue;
    }

    const allowed = ALLOWED_TAGS[tag];
    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase();
      if (!allowed.includes(name)) child.removeAttribute(attr.name);
      else if (name === "href" && !isSafeHref(attr.value)) child.removeAttribute(attr.name);
    }

    if (tag === "A" && child.getAttribute("href")) {
      child.setAttribute("target", "_blank");
      child.setAttribute("rel", "noopener noreferrer");
    }
  }
};

/**
 * @param {string} html
 * @returns {string} sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  cleanElement(doc.body);
  return doc.body.innerHTML;
};

/** True when the editor holds nothing but empty markup / whitespace. */
export const isHtmlEmpty = (html) => {
  if (!html) return true;
  const text = String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length === 0;
};

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Legacy records stored the description as plain text with newlines. Lift that
 * into paragraphs the first time it reaches the editor so nothing is lost, and
 * sanitize anything that already is HTML.
 */
export const normalizeToHtml = (value) => {
  if (!value) return "";
  const str = String(value);
  if (/<[a-z][\s\S]*>/i.test(str)) return sanitizeHtml(str);

  return str
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

/** Rough plain-text length, for the character counter. */
export const htmlToText = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  return doc.body.textContent || "";
};

export default sanitizeHtml;
