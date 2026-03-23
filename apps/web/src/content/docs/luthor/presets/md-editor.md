---
title: "Markdown Editor"
description: "Markdown-focused preset profile built on LegacyRichEditor with markdown source of truth behavior."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "MarkDownEditor"
  - "md-editor"
  - "markdownSourceOfTruth"
props:
  - "initialMode"
  - "defaultEditorView"
  - "featureFlags"
exports:
  - "MarkDownEditor"
  - "mdEditorPreset"
commands:
  - "block.codeblock"
  - "format.code"
extensions:
  []
nodes:
  - "code"
  - "list"
  - "heading"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/md-editor/MarkDownEditor.tsx"
navGroup: "luthor"
navOrder: 100
---

# Markdown Editor

This preset is optimized for markdown-driven editing.

## When to use this

Use `MarkDownEditor` when markdown text is your primary source-of-truth.

## Mode profile

- Modes: `visual-only`, `visual`, `json`, `markdown`.
- Sets `markdownBridgeFlavor="github"` and `markdownSourceOfTruth`.

## Preset props

- `initialMode`: Sets initial active mode.
- `defaultEditorView`: Alias for initial mode selection.
- `featureFlags`: Optional per-feature overrides. Includes `codeIntelligence`.

## Code intelligence toggle

~~~tsx
<MarkDownEditor
  initialMode="markdown"
  featureFlags={{ codeIntelligence: false }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { MarkDownEditor } from '@lyfie/luthor';

export function App() {
  return <MarkDownEditor initialMode="markdown" />;
}
~~~


