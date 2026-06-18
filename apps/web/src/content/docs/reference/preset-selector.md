---
title: "Preset Selector"
description: "Decision matrix for choosing the right preset by workflow, source mode profile, and feature policy."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "preset selector"
  - "decision matrix"
  - "extensive"
  - "legacy-rich"
  - "md-editor"
  - "html-editor"
  - "papyra"
props:
  - "featureFlags"
  - "initialMode"
  - "availableModes"
exports:
  - "presetRegistry"
  - "ExtensiveEditor"
  - "LegacyRichEditor"
  - "MarkDownEditor"
  - "HTMLEditor"
  - "PapyraEditor"
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/index.ts"
navGroup: "reference"
navOrder: 30
---

# Preset Selector

Use this table to choose the right preset quickly.

## What this page answers

- Which preset fits my workflow and source mode needs?

| Need | Preset |
| --- | --- |
| Full capability, broad modes | [Extensive Editor](/docs/luthor/presets/extensive-editor/) |
| Legacy-compatible rich editing | [Legacy Rich Editor](/docs/luthor/presets/legacy-rich-editor/) |
| Markdown-focused source of truth | [Markdown Editor](/docs/luthor/presets/md-editor/) |
| HTML-focused source workflows | [HTML Editor](/docs/luthor/presets/html-editor/) |
| Markdown-native note canvas (embeds, tokens, adapter) | [Papyra Editor](/docs/luthor/presets/papyra-editor/) |


