---
title: "Extensive Editor"
description: "Full preset profile with all core features enabled and broad mode support."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "ExtensiveEditor"
  - "extensive preset"
  - "full editor"
props:
  - "featureFlags"
  - "availableModes"
  - "maxListIndentation"
exports:
  - "ExtensiveEditor"
  - "extensivePreset"
  - "createExtensivePreset"
commands:
  - "palette.show"
  - "insert.table"
  - "format.bold"
extensions:
  []
nodes:
  - "table"
  - "image"
  - "iframe-embed"
  - "youtube-embed"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/extensive/ExtensiveEditor.tsx"
  - "packages/luthor/src/presets/extensive/extensions.tsx"
navGroup: "luthor"
navOrder: 60
---

# Extensive Editor

This preset is the broadest out-of-box profile.

## When to use this

Use `ExtensiveEditor` when you want full formatting, media, code, and command workflows in one preset.

## Mode profile

- Default modes: `visual-editor`, `visual-only`, `json`, `markdown`, `html`.
- Default initial mode: `visual-editor`.

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
~~~


