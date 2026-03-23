---
title: "HTML Editor"
description: "HTML-focused preset profile built on LegacyRichEditor for source-first HTML editing."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "HTMLEditor"
  - "html-editor"
  - "html source mode"
props:
  - "initialMode"
  - "defaultEditorView"
exports:
  - "HTMLEditor"
  - "htmlEditorPreset"
commands:
  - "block.codeblock"
  - "insert.horizontal-rule"
extensions:
  []
nodes:
  - "table"
  - "image"
  - "paragraph"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/html-editor/HTMLEditor.tsx"
navGroup: "luthor"
navOrder: 110
---

# HTML Editor

This preset is optimized for HTML source editing flows.

## When to use this

Use `HTMLEditor` when HTML output is a first-class editing artifact.

## Mode profile

- Modes: `visual-only`, `visual`, `json`, `html`.

~~~tsx
import '@lyfie/luthor/styles.css';
import { HTMLEditor } from '@lyfie/luthor';

export function App() {
  return <HTMLEditor initialMode="html" />;
}
~~~


