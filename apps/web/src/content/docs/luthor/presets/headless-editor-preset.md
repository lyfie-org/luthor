---
title: "Headless Editor Preset"
description: "Preset wrapper that demonstrates source mode handling and controlled bridge behavior on top of extensive extensions."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "HeadlessEditorPreset"
  - "headless-editor preset"
  - "source mode"
props:
  - "initialMode"
  - "defaultEditorView"
  - "featureFlags"
exports:
  - "HeadlessEditorPreset"
  - "headlessEditorPreset"
commands:
  - "block.codeblock"
  - "edit.undo"
  - "edit.redo"
extensions:
  []
nodes:
  - "code"
  - "paragraph"
  - "list"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/headless-editor/HeadlessEditorPreset.tsx"
navGroup: "luthor"
navOrder: 130
---

# Headless Editor Preset

This preset offers a constrained profile for source-mode-centric use cases.

## When to use this

Use `HeadlessEditorPreset` when you want a compact preset that still exposes JSON/Markdown/HTML mode transitions.

## Mode profile

- Modes: `visual-only`, `visual`, `json`, `markdown`, `html`.

## Preset props

- `initialMode`: Sets the first active mode when no `defaultEditorView` is provided.
- `defaultEditorView`: Alias for initial mode selection; useful when binding mode via config objects.
- `featureFlags`: Optional per-feature overrides. Includes `codeIntelligence`.

## Code intelligence toggle

~~~tsx
<HeadlessEditorPreset
  featureFlags={{ codeIntelligence: false }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { HeadlessEditorPreset } from '@lyfie/luthor';

export function App() {
  return <HeadlessEditorPreset initialMode="visual" />;
}
~~~


