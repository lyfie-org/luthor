---
title: "Metadata Comment System"
description: "Metadata envelope behavior for markdown/html bridges and preservation rules for unsupported fields."
package: "headless"
docType: "reference"
surface: "bridge"
keywords:
  - "metadata envelope"
  - "appendMetadataEnvelopes"
  - "rehydrateDocumentFromEnvelopes"
  - "metadataMode"
props:
  []
exports:
  - "appendMetadataEnvelopes"
  - "extractMetadataEnvelopes"
  - "rehydrateDocumentFromEnvelopes"
  - "prepareDocumentForBridge"
commands:
  []
extensions:
  []
nodes:
  - "root"
  - "paragraph"
  - "text"
  - "linebreak"
  - "tab"
  - "heading"
  - "quote"
  - "list"
  - "listitem"
  - "link"
  - "autolink"
  - "code"
  - "code-highlight"
  - "horizontalrule"
  - "image"
  - "iframe-embed"
  - "youtube-embed"
  - "table"
  - "tablerow"
  - "tablecell"
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/core/metadata-envelope.ts"
  - "packages/headless/src/core/markdown.ts"
  - "packages/headless/src/core/html.ts"
navGroup: "luthor_headless"
navOrder: 40
---

# Metadata Comment System

This is the source-of-truth page for bridge metadata envelopes.

## What this page answers

- How are unsupported fields preserved across markdown/html bridges?
- What does `metadataMode` change?

## Behavior summary

- `metadataMode: "preserve"` keeps `luthor:meta v1` envelopes.
- `metadataMode: "none"` skips envelope append/extract.
- Import rehydration is tolerant to malformed or unknown envelopes.


