---
title: "Legacy Rich Editor"
description: "Legacy-compatible rich editor profile with metadata-free bridge mode and constrained defaults."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "LegacyRichEditor"
  - "legacy rich"
  - "metadataMode none"
props:
  - "sourceFormat"
  - "initialMode"
  - "featureFlags"
exports:
  - "LegacyRichEditor"
  - "legacyRichPreset"
commands:
  - "block.codeblock"
  - "insert.horizontal-rule"
  - "insert.table"
extensions:
  []
nodes:
  - "table"
  - "image"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/legacy-rich/LegacyRichEditor.tsx"
navGroup: "luthor"
navOrder: 90
---

# Legacy Rich Editor

This preset preserves legacy compatibility with stricter source behavior.

## When to use this

Use `LegacyRichEditor` when migrating older markdown/html workflows and you need metadata-free bridge mode.

## Mode profile

- `sourceFormat="markdown"`: `visual-only`, `visual`, `json`, `markdown`.
- `sourceFormat="html"`: `visual-only`, `visual`, `json`, `html`.
- `sourceFormat="both"`: `visual-only`, `visual`, `markdown`, `html`.

~~~tsx
import '@lyfie/luthor/styles.css';
import { LegacyRichEditor } from '@lyfie/luthor';

export function App() {
  return <LegacyRichEditor sourceFormat="both" initialMode="visual" />;
}
~~~


