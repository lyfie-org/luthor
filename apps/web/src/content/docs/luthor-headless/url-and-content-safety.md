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
props:
  - "validateUrl"
exports:
  - "isSafeUrl"
  - "sanitizeUrlForAttribute"
  - "DEFAULT_ALLOWED_URL_SCHEMES"
  - "EMBED_ALLOWED_URL_SCHEMES"
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

## Scope of the guarantee

- Luthor validates URLs it turns into anchors and iframe sources, and
  sanitizes what it renders into the live DOM.
- Luthor does not sanitize markdown or JSON *output* — exports are
  lossless by design, and a host rendering them outside Luthor needs its
  own final-render policy.
- The blur/lock behavior of embeds is UX, not a security boundary;
  server-side authorization for media URLs stays with the host.
