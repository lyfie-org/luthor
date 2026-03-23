---
title: "Slash Editor"
description: "Slash-command-first preset profile with allowlist defaults and optional draggable behavior."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "SlashEditor"
  - "slash commands"
  - "allowlist"
props:
  - "slashVisibility"
  - "isDraggableEnabled"
  - "featureFlags"
exports:
  - "SlashEditor"
  - "slashEditorPreset"
commands:
  - "block.heading1"
  - "list.bullet"
  - "insert.table"
extensions:
  []
nodes:
  - "list"
  - "heading"
  - "table"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/slash-editor/SlashEditor.tsx"
navGroup: "luthor"
navOrder: 120
---

# Slash Editor

This preset is optimized for slash menu workflows.

## When to use this

Use `SlashEditor` when command discovery should be slash-driven and toolbar usage is secondary.

## Mode profile

- Modes: `visual-only`, `visual`, `json`, `markdown`, `html`.
- Toolbar is off by default.

## Preset props

- `slashVisibility`: Controls slash command allow/deny lists.
- `isDraggableEnabled`: Enables or disables draggable block handles.
- `featureFlags`: Optional per-feature overrides. Includes `codeIntelligence`.

## Code intelligence toggle

~~~tsx
<SlashEditor
  featureFlags={{ codeIntelligence: false }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { SlashEditor } from '@lyfie/luthor';

export function App() {
  return <SlashEditor placeholder="Type / for commands" />;
}
~~~


