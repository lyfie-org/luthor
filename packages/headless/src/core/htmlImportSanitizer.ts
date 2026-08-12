/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  DEFAULT_ALLOWED_URL_SCHEMES,
  EMBED_ALLOWED_URL_SCHEMES,
  isSafeUrl,
} from "../utils/urlSafety";

/**
 * Allowlist sanitization for HTML entering `htmlToJSON`. Runs on the
 * DOMParser output (an inert document — nothing executes during parsing)
 * before `$generateNodesFromDOM` converts it into Lexical nodes.
 *
 * Lexical's conversion already discards most dangerous markup because it
 * only extracts the properties it recognizes. This pass exists for what
 * conversion does NOT stop: URL-bearing attributes that land verbatim in
 * the model (`a[href]`, `img[src]`, embed `iframe[src]`) and container
 * elements whose text payload would otherwise leak through as content
 * (`svg`, `object`, `template`, form controls). It is deliberately written
 * by hand — a few sets and a tree walk — so the headless package stays
 * dependency-free.
 *
 * Scope: this sanitizes what Luthor converts. It is not a general-purpose
 * HTML sanitizer for other uses; markup that is kept here still has to
 * pass through Lexical's conversion to reach the document model.
 */

/**
 * Elements removed together with their entire subtree. Their content is
 * either executable, invisible, or meaningless as document text.
 */
const DROPPED_ELEMENTS = new Set([
  "applet",
  "area",
  "audio",
  "base",
  "basefont",
  "button",
  "canvas",
  "datalist",
  "dialog",
  "embed",
  "frame",
  "frameset",
  "head",
  "input",
  "link",
  "map",
  "math",
  "meta",
  "noframes",
  "noscript",
  "object",
  "optgroup",
  "option",
  "param",
  "portal",
  "script",
  "select",
  "style",
  "svg",
  "template",
  "textarea",
  "title",
  "track",
  "video",
  "xmp",
]);

/**
 * Elements kept as-is (after attribute sanitization). Everything Lexical's
 * conversion understands, plus the benign formatting wrappers that real
 * paste sources (Word, Google Docs, VS Code) produce.
 */
const KEPT_ELEMENTS = new Set([
  "a",
  "abbr",
  "article",
  "aside",
  "b",
  "big",
  "blockquote",
  "body",
  "br",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "font",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "s",
  "samp",
  "section",
  "small",
  "source",
  "span",
  "strike",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "tt",
  "u",
  "ul",
  "var",
  "wbr",
]);

/**
 * Attributes kept on any element. `data-*` and `aria-*` are allowed by
 * prefix (both are inert and several Luthor node conversions rely on
 * `data-` markers). URL-bearing attributes (`href`, `src`) are handled
 * separately, and `style` values are filtered below.
 */
const KEPT_ATTRIBUTES = new Set([
  "align",
  "allowfullscreen",
  "alt",
  "checked",
  "class",
  "colspan",
  "dir",
  "height",
  "lang",
  "loading",
  "media",
  "referrerpolicy",
  "rel",
  "reversed",
  "role",
  "rowspan",
  "scope",
  "sizes",
  "span",
  "srcset",
  "start",
  "style",
  "target",
  "title",
  "type",
  "value",
  "width",
]);

/**
 * Style values that smuggle a URL or legacy script hook are dropped
 * wholesale. Conversion only needs plain declarations (`text-align`,
 * `font-weight`, `white-space`, colors), none of which use `url()`.
 */
const HOSTILE_STYLE_PATTERN = /url\s*\(|expression\s*\(|@import|javascript:/i;

/**
 * `data:` image sources are allowed only for actual image payloads —
 * pasted screenshots from Word/Docs arrive this way.
 */
const DATA_IMAGE_PATTERN = /^data:image\//i;

/**
 * Options for {@link sanitizeHtmlImportDocument}. Every field widens the
 * default policy; there is no way to widen it by accident.
 */
export interface HtmlImportSanitizeOptions {
  /** Extra element tag names to keep (lowercase). */
  additionalAllowedElements?: readonly string[];
  /** Extra attribute names to keep on any element (lowercase). */
  additionalAllowedAttributes?: readonly string[];
  /**
   * Schemes accepted for `a[href]`.
   * Default: http, https, mailto, tel (plus `#` and `//` references).
   */
  allowedLinkSchemes?: readonly string[];
  /**
   * Schemes accepted for `iframe[src]`.
   * Default: http, https.
   */
  allowedFrameSchemes?: readonly string[];
  /**
   * Schemes accepted for `img[src]`, in addition to `data:image/*` which
   * is always allowed. Default: http, https, blob.
   */
  allowedImageSchemes?: readonly string[];
}

const DEFAULT_IMAGE_SCHEMES: readonly string[] = Object.freeze([
  "http",
  "https",
  "blob",
]);

function isSafeImageSrc(src: string, allowedSchemes: readonly string[]): boolean {
  const trimmed = src.trim();
  if (!trimmed || DATA_IMAGE_PATTERN.test(trimmed)) {
    return true;
  }

  // A relative reference cannot carry a scheme, and an <img> cannot execute
  // script from its src anyway — the only thing to reject is an absolute
  // URL whose scheme is off the allowlist (javascript:, data:text/html, …).
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return true;
  }
  return allowedSchemes.includes(parsed.protocol.slice(0, -1));
}

function unwrapElement(element: Element): void {
  element.replaceWith(...Array.from(element.childNodes));
}

/**
 * Sanitizes a parsed HTML document in place. Elements outside the
 * allowlist are unwrapped (their children survive) so unknown wrappers
 * from real-world paste sources never cost the user their text; elements
 * on the drop list are removed with their whole subtree.
 */
export function sanitizeHtmlImportDocument(
  parsedDocument: Document,
  options?: HtmlImportSanitizeOptions,
): void {
  const keptElements = options?.additionalAllowedElements
    ? new Set([...KEPT_ELEMENTS, ...options.additionalAllowedElements])
    : KEPT_ELEMENTS;
  const keptAttributes = options?.additionalAllowedAttributes
    ? new Set([...KEPT_ATTRIBUTES, ...options.additionalAllowedAttributes])
    : KEPT_ATTRIBUTES;
  const linkSchemes = options?.allowedLinkSchemes ?? DEFAULT_ALLOWED_URL_SCHEMES;
  const frameSchemes = options?.allowedFrameSchemes ?? EMBED_ALLOWED_URL_SCHEMES;
  const imageSchemes = options?.allowedImageSchemes ?? DEFAULT_IMAGE_SCHEMES;

  const sanitizeAttributes = (element: Element, tagName: string): void => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();

      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (name === "href") {
        // Anchors are handled before this point; an href on any other
        // element is dead weight.
        if (tagName !== "a") {
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (name === "src") {
        if (tagName === "iframe" && !isSafeUrl(attribute.value, { allowedSchemes: frameSchemes })) {
          element.removeAttribute(attribute.name);
        } else if (tagName === "source" && !isSafeUrl(attribute.value, { allowedSchemes: frameSchemes })) {
          element.removeAttribute(attribute.name);
        }
        // img[src] is validated before this point (unsafe images are
        // removed outright); other elements keeping `src` is harmless
        // because conversion never reads it.
        continue;
      }

      if (name === "style") {
        if (HOSTILE_STYLE_PATTERN.test(attribute.value)) {
          element.removeAttribute(attribute.name);
        }
        continue;
      }

      if (
        !keptAttributes.has(name) &&
        !name.startsWith("data-") &&
        !name.startsWith("aria-")
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  };

  const sanitizeChildren = (parent: Node): void => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      if (DROPPED_ELEMENTS.has(tagName)) {
        element.remove();
        continue;
      }

      if (tagName === "a") {
        const href = element.getAttribute("href");
        if (href !== null && !isSafeUrl(href, { allowedSchemes: linkSchemes })) {
          // Unwrapping (rather than deleting) keeps the link text as plain
          // text, so a hostile href never costs the user visible content.
          sanitizeChildren(element);
          unwrapElement(element);
          continue;
        }
      }

      if (tagName === "img") {
        const src = element.getAttribute("src") ?? "";
        if (!isSafeImageSrc(src, imageSchemes)) {
          element.remove();
          continue;
        }
      }

      if (!keptElements.has(tagName)) {
        sanitizeChildren(element);
        unwrapElement(element);
        continue;
      }

      sanitizeAttributes(element, tagName);
      sanitizeChildren(element);
    }
  };

  if (parsedDocument.body) {
    sanitizeChildren(parsedDocument.body);
  }
}
