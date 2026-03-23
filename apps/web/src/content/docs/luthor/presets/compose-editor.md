---
title: "Compose Editor"
description: "Compact preset profile for message composition and lightweight authoring flows."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "ComposeEditor"
  - "compose preset"
  - "compact toolbar"
props:
  - "compactToolbar"
  - "featureFlags"
exports:
  - "ComposeEditor"
  - "composePreset"
commands:
  - "format.bold"
  - "format.italic"
  - "link.insert"
extensions:
  []
nodes:
  - "paragraph"
  - "list"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/compose/ComposeEditor.tsx"
navGroup: "luthor"
navOrder: 70
---

# Compose Editor

This preset keeps authoring focused and lightweight.

## When to use this

Use `ComposeEditor` for comments, replies, short updates, and other compact composer flows.

## Mode profile

- Modes: `visual-only`, `visual`, `json`.

## Preset props

- `compactToolbar`: Reduces toolbar footprint for dense composer layouts.
- `featureFlags`: Optional per-feature overrides. Includes `codeIntelligence`.

## Code intelligence toggle

~~~tsx
<ComposeEditor
  compactToolbar
  featureFlags={{ codeIntelligence: false }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ComposeEditor } from '@lyfie/luthor';

export function App() {
  return <ComposeEditor compactToolbar placeholder="Write a reply..." />;
}
~~~


