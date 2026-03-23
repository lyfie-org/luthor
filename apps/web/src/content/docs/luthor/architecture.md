---
title: "@lyfie/luthor Architecture"
description: "Preset stack architecture from package exports to core command generation and extension assembly."
package: "luthor"
docType: "concept"
surface: "preset"
keywords:
  - "architecture"
  - "preset stack"
  - "commands"
  - "feature policy"
props:
  - "featureFlags"
  - "shortcutConfig"
  - "slashCommandVisibility"
exports:
  - "presetRegistry"
  - "generateCommands"
  - "createPresetEditorConfig"
commands:
  - "palette.show"
  - "block.codeblock"
extensions:
  - "createExtensiveExtensions"
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "packages/luthor/src/presets/index.ts"
  - "packages/luthor/src/core/commands.ts"
  - "packages/luthor/src/presets/_shared/presetPolicy.ts"
navGroup: "luthor"
navOrder: 20
---

# @lyfie/luthor Architecture

The preset package is layered so defaults are strong and overrides remain explicit.

## What this page answers

- How are presets composed?
- Where are feature policies and command IDs resolved?

## Layers

1. Package entry exports presets and core helpers.
2. Preset modules define mode/profile defaults.
3. `ExtensiveEditor` owns shared runtime behavior.
4. Headless extensions execute Lexical-level behavior.

## Feature policy model

- Presets compose defaults and enforced flags through `PresetFeaturePolicy`.
- Final behavior resolves inside `ExtensiveEditor` via `resolveFeatureFlags`.


