---
title: "@lyfie/luthor Overview"
description: "Preset package overview, export surfaces, and when to choose @lyfie/luthor over headless runtime."
package: "luthor"
docType: "guide"
surface: "preset"
keywords:
  - "@lyfie/luthor"
  - "presets"
  - "ExtensiveEditor"
  - "presetRegistry"
props:
  - "featureFlags"
  - "availableModes"
exports:
  - "ExtensiveEditor"
  - "ComposeEditor"
  - "presetRegistry"
commands:
  - "palette.show"
extensions:
  []
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
  - "packages/luthor/src/presets/index.ts"
navGroup: "luthor"
navOrder: 10
---

# @lyfie/luthor Overview

`@lyfie/luthor` ships preset editors on top of the headless runtime.

## What this page answers

- What does the preset package export?
- When should I choose presets?

## Use this package when

- You need a production UI fast.
- You want source modes, toolbar, and feature gates prewired.
- You still need override hooks through props.

## Key exports

- Preset components: `ExtensiveEditor`, `ComposeEditor`, `SimpleEditor`, `LegacyRichEditor`, `MarkDownEditor`, `HTMLEditor`, `SlashEditor`, `HeadlessEditorPreset`
- Registry and factories: `presetRegistry`, `createExtensivePreset`, `createExtensiveExtensions`
- Shared command layer: `generateCommands`, `registerKeyboardShortcuts`


