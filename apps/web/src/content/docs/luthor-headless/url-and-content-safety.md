---
title: "URL and Content Safety"
description: "The default URL scheme allowlist for links and embeds, how to override it, and what the guarantee does and does not cover."
package: "headless"
docType: "guide"
surface: "extension"
keywords:
  - "security"
  - "url validation"
  - "scheme allowlist"
  - "javascript: url"
  - "isSafeUrl"
  - "sanitizeUrlForAttribute"
  - "validateUrl"
  - "html sanitization"
  - "sanitizeHtmlImportDocument"
  - "xss"
props:
  - "validateUrl"
  - "sanitize"
exports:
  - "isSafeUrl"
  - "sanitizeUrlForAttribute"
  - "DEFAULT_ALLOWED_URL_SCHEMES"
  - "EMBED_ALLOWED_URL_SCHEMES"
  - "sanitizeHtmlImportDocument"
  - "sanitizeEmbedTarget"
commands:
  []
extensions:
  - "linkExtension"
  - "iframeEmbedExtension"
  - "youTubeEmbedExtension"
nodes:
  - "iframe-embed"
  - "youtube-embed"
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/utils/urlSafety.ts"
  - "packages/headless/src/extensions/formatting/LinkExtension.tsx"
  - "packages/headless/src/extensions/media/IframeEmbedExtension.tsx"
  - "packages/headless/src/core/htmlImportSanitizer.ts"
  - "packages/headless/src/core/html.ts"
  - "packages/headless/src/core/metadata-envelope.ts"
  - "packages/headless/src/extensions/embeds/FileDropUploadExtension.tsx"
navGroup: "luthor_headless"
navOrder: 45
---

# URL and Content Safety

Luthor treats every URL in a document as untrusted input. A document may
have been pasted from a hostile page, synced from another machine, or
loaded from a store the host does not control — so "the user typed it"
is never assumed.

## What this page answers

- Which URL schemes do links and embeds accept by default?
- How do I allow a custom scheme like `obsidian://` deliberately?
- What does the guarantee cover, and what stays the host's job?

## Link URLs

The link extension validates every URL at each entry point — paste,
auto-linking while typing, and the programmatic `insertLink` /
`updateLink` / `updateLinkByKey` commands — with one default validator
that accepts:

- `http:`, `https:`, `mailto:`, `tel:` absolute URLs
- same-document references (`#section`)
- protocol-relative references (`//example.com/path`)

Everything else is rejected, including `javascript:`, `data:`, and
`vbscript:` URLs in any casing or whitespace disguise (`JaVaScRiPt:`,
`java\tscript:`). Rejected URLs never enter the document model, so they
also never appear in markdown, JSON, or HTML output.

As a second layer, Lexical's own `LinkNode` renders any non-allowlisted
scheme that reaches the model (for example from a pre-existing document)
as an inert `about:blank` anchor. The raw URL still round-trips through
JSON and markdown untouched — a host rendering exported markdown with
its own pipeline must apply its own URL policy there.

### Allowing a custom scheme

`validateUrl` is a plain function, so hosts that need a custom protocol
opt in explicitly. `isSafeUrl` is exported as a building block:

```tsx
import { isSafeUrl, linkExtension } from "@lyfie/luthor-headless";

linkExtension.configure({
  validateUrl: (url) =>
    isSafeUrl(url, {
      allowedSchemes: ["http", "https", "mailto", "tel", "obsidian"],
    }),
});
```

## Embed sources

The iframe and YouTube embed commands only ever accept `http(s)` URLs.
Documents, however, can carry an arbitrary `src` into the model through
`importJSON` or pasted HTML (`importDOM`) — those paths deliberately do
not rewrite the value, so loading and saving a document never mutates
it. Instead, the `src` is sanitized at the DOM boundary: anything that
is not `http(s)` renders (and exports to HTML) as `about:blank`.

`sanitizeUrlForAttribute(url, { allowedSchemes })` implements that gate
and is exported for hosts building their own embed nodes.

## HTML import

`htmlToJSON` sanitizes markup before converting it, using a hand-written
allowlist pass (`sanitizeHtmlImportDocument`) applied to the parsed —
inert — document:

- **Dropped with their content:** `script`, `style`, `svg`, `math`,
  `object`, `embed`, `template`, form controls, and other elements whose
  payload is executable or meaningless as document text.
- **Unwrapped:** unknown elements lose their tag but keep their children,
  so a Word or Google Docs wrapper never costs the user their text.
- **Attributes:** event handlers (`on*`) and `srcdoc` are always removed;
  everything else outside a small allowlist (plus inert `data-*` /
  `aria-*`) is removed; `style` values carrying `url(...)`,
  `expression(...)`, or `@import` are dropped whole.
- **URLs:** `a[href]` goes through the link scheme allowlist (a hostile
  anchor is unwrapped to plain text); `iframe[src]` through the embed
  allowlist; `img[src]` rejects script-capable absolute schemes while
  keeping `data:image/*` and relative references, so pasted screenshots
  survive.

The policy only widens, never narrows, through options:

```tsx
import { htmlToJSON } from "@lyfie/luthor-headless";

// Widen deliberately for a trusted source…
htmlToJSON(html, {
  sanitize: { allowedLinkSchemes: ["http", "https", "obsidian"] },
});

// …or disable entirely for markup the host itself generated.
htmlToJSON(trustedCmsMarkup, { sanitize: false });
```

Luthor sanitizes what it converts. It is **not** a general-purpose HTML
sanitizer: markup that survives this pass still has to be understood by
the Lexical conversion to reach the document, and the pass makes no
promises about HTML used outside `htmlToJSON`.

## Other document-derived URLs

The same DOM-boundary rule covers every remaining place a document can
supply a URL:

- **Linked images** (`[![alt](img)](url)` in markdown) — `linkHref` has
  no Lexical-side sanitization, so the rendered and exported anchors are
  scheme-gated while the model keeps the raw value.
- **Saved cards** (`![[card:url]]`) — same treatment for the card anchor.
- **Wikilinks** render as `href="#"` and navigate through the host
  adapter, so they never carry a document-supplied URL.

## Upload filenames

`FileDropUploadExtension` writes the host's returned filename into the
body as `![[filename]]`. The wikilink syntax has no escape mechanism, so
the reserved characters `[ ] # ^ |` and control characters are replaced
with `-` before insertion (`sanitizeEmbedTarget`) — a file named
`x]]y.png` would otherwise close the embed early and corrupt the body on
the next save. Hosts should apply the same normalization server-side, or
the stored name and the body reference will disagree.

## Metadata envelopes

Envelopes preserve unsupported nodes inside `<!-- luthor:meta -->`
comments. Payload `>` characters are written as their JSON `\u003e`
escape so document text containing `-->` cannot terminate the comment
early and spill markup into the host's page. `JSON.parse` restores the
value exactly, so round-trips stay lossless.

## Scope of the guarantee

- Luthor validates URLs it turns into anchors and iframe sources, and
  sanitizes what it renders into the live DOM.
- Luthor does not sanitize markdown or JSON *output* — exports are
  lossless by design, and a host rendering them outside Luthor needs its
  own final-render policy.
- The blur/lock behavior of embeds is UX, not a security boundary;
  server-side authorization for media URLs stays with the host.
