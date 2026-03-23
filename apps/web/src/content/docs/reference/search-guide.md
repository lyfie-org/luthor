---
title: "Search Guide"
description: "Docs search syntax, token matching behavior, and filter examples for fast API discovery."
package: "shared"
docType: "reference"
surface: "tooling"
keywords:
  - "search guide"
  - "pkg filter"
  - "type filter"
  - "surface filter"
props:
  - "maxListIndentation"
exports:
  - "ExtensiveEditorProps"
  - "createEditorSystem"
commands:
  - "insert.table"
  - "palette.show"
extensions:
  - "codeIntelligenceExtension"
nodes:
  - "iframe-embed"
frameworks:
  []
lastVerifiedFrom:
  - "apps/web/src/features/docs/docs-search.tsx"
navGroup: "reference"
navOrder: 10
---

# Search Guide

Use filters and exact API tokens to find docs quickly.

## What this page answers

- How do I filter by package/type/surface?
- How do exact API tokens rank?

## Filter syntax

- `pkg:luthor`
- `pkg:headless`
- `type:reference`
- `surface:command`

## Example queries

- `pkg:luthor maxListIndentation`
- `pkg:headless surface:extension codeIntelligenceExtension`
- `surface:command insert.table`


