---
title: "Nodes and Bridges Reference"
description: "Supported node sets, representability constraints, and metadata envelope bridge behavior."
package: "headless"
docType: "reference"
surface: "node"
keywords:
  - "nodes"
  - "bridges"
  - "metadataMode"
  - "isMarkdownRepresentable"
  - "isHTMLRepresentable"
props:
  []
exports:
  - "MARKDOWN_SUPPORTED_NODE_TYPES"
  - "HTML_SUPPORTED_NODE_TYPES"
  - "MARKDOWN_NATIVE_KEY_MAP"
  - "HTML_NATIVE_KEY_MAP"
  - "isMarkdownRepresentable"
  - "isHTMLRepresentable"
  - "extractMarkdownMetadataPatch"
  - "extractHTMLMetadataPatch"
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
  - "packages/headless/src/core/source-capability.ts"
  - "packages/headless/src/core/metadata-envelope.ts"
  - "packages/headless/src/core/markdown.ts"
  - "packages/headless/src/core/html.ts"
navGroup: "luthor_headless"
navOrder: 130
---

# Nodes and Bridges Reference

This page documents what bridge conversions can represent natively.

## What this page answers

- Which node types are supported in markdown/html bridges?
- How are non-native fields preserved?

## Supported bridge node types

- `root`
- `paragraph`
- `text`
- `linebreak`
- `tab`
- `heading`
- `quote`
- `list`
- `listitem`
- `link`
- `autolink`
- `code`
- `code-highlight`
- `horizontalrule`
- `image`
- `iframe-embed`
- `youtube-embed`
- `table`
- `tablerow`
- `tablecell`

## Metadata behavior

- `metadataMode="preserve"` keeps envelope comments for non-native fields.
- `metadataMode="none"` drops envelope persistence and runs metadata-free conversion.
- Rehydrate flow restores preserved nodes/fields where possible.


