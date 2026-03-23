---
title: "Structure and Lists"
description: "Document structure, list behavior, tables, links, and indentation controls."
package: "headless"
docType: "reference"
surface: "extension"
keywords:
  - "listExtension"
  - "tabIndentExtension"
  - "tableExtension"
  - "linkExtension"
props:
  []
exports:
  - "listExtension"
  - "tabIndentExtension"
  - "tableExtension"
  - "linkExtension"
  - "blockFormatExtension"
  - "horizontalRuleExtension"
commands:
  - "insert.table"
  - "list.bullet"
  - "list.numbered"
  - "list.check"
extensions:
  - "listExtension"
  - "tabIndentExtension"
  - "tableExtension"
  - "linkExtension"
  - "blockFormatExtension"
  - "horizontalRuleExtension"
nodes:
  - "list"
  - "listitem"
  - "table"
  - "tablerow"
  - "tablecell"
  - "link"
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/extensions/formatting/index.ts"
  - "packages/headless/src/extensions/core/TabIndentExtension.tsx"
navGroup: "luthor_headless"
navOrder: 70
---

# Structure and Lists

This group covers structural blocks and nested lists.

## What this page answers

- Which extensions own lists, indentation, and table insertion?

## Extension set

- `linkExtension`, `blockFormatExtension`, `listExtension`, `tableExtension`, `horizontalRuleExtension`, `tabIndentExtension`.


