---
title: "Code and Devtools"
description: "Code block, code intelligence, and source bridge conversion surfaces for developer-heavy workflows."
package: "headless"
docType: "reference"
surface: "extension"
keywords:
  - "codeExtension"
  - "codeIntelligenceExtension"
  - "jsonToMarkdown"
  - "markdownToJSON"
props:
  []
exports:
  - "codeExtension"
  - "codeIntelligenceExtension"
  - "codeFormatExtension"
  - "markdownToJSON"
  - "jsonToMarkdown"
  - "htmlToJSON"
  - "jsonToHTML"
commands:
  - "block.codeblock"
  - "block.code-language"
  - "block.code-language.auto"
extensions:
  - "codeExtension"
  - "codeIntelligenceExtension"
  - "codeFormatExtension"
nodes:
  - "code"
  - "code-highlight"
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/extensions/formatting/CodeExtension.tsx"
  - "packages/headless/src/extensions/formatting/CodeIntelligenceExtension.ts"
  - "packages/headless/src/core/markdown.ts"
  - "packages/headless/src/core/html.ts"
navGroup: "luthor_headless"
navOrder: 90
---

# Code and Devtools

This group covers code authoring and source bridge workflows.

## What this page answers

- Which APIs control code blocks and language detection?
- Which bridge APIs map JSON/Markdown/HTML?

## Extension set

- `codeExtension`
- `codeIntelligenceExtension`
- `codeFormatExtension`

## Bridge APIs

- `markdownToJSON` / `jsonToMarkdown`
- `htmlToJSON` / `jsonToHTML`


