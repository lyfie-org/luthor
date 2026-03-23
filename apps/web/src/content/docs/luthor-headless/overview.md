---
title: "@lyfie/luthor-headless Overview"
description: "Headless runtime overview, core exports, and extension-first architecture choices."
package: "headless"
docType: "guide"
surface: "extension"
keywords:
  - "luthor-headless"
  - "createEditorSystem"
  - "extension-first"
props:
  []
exports:
  - "createEditorSystem"
  - "createExtension"
  - "RichText"
commands:
  []
extensions:
  - "richTextExtension"
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/headless/src/index.ts"
  - "packages/headless/src/core/index.ts"
navGroup: "luthor_headless"
navOrder: 10
---

# @lyfie/luthor-headless Overview

This package is the runtime layer for extension-first editor systems.

## What this page answers

- Which core APIs define the runtime?
- Why use headless over presets?

## Core exports

- System factory: `createEditorSystem`
- Extension factory: `createExtension`
- Bridge APIs: `markdownToJSON`, `jsonToMarkdown`, `htmlToJSON`, `jsonToHTML`
- Theme utilities: `defaultLuthorTheme`, `mergeThemes`, `createEditorThemeStyleVars`


