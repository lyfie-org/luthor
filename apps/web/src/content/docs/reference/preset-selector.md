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
  - "compose"
  - "simple-editor"
  - "legacy-rich"
  - "md-editor"
  - "html-editor"
  - "slash-editor"
  - "headless-editor"
props:
  - "featureFlags"
  - "initialMode"
  - "availableModes"
exports:
  - "presetRegistry"
  - "ExtensiveEditor"
  - "ComposeEditor"
  - "SimpleEditor"
  - "LegacyRichEditor"
  - "MarkDownEditor"
  - "HTMLEditor"
  - "SlashEditor"
  - "HeadlessEditorPreset"
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
| Compact composer | [Compose Editor](/docs/luthor/presets/compose-editor/) |
| Chat-style input with send flow | [Simple Editor](/docs/luthor/presets/simple-editor/) |
| Legacy-compatible rich editing | [Legacy Rich Editor](/docs/luthor/presets/legacy-rich-editor/) |
| Markdown-focused source of truth | [Markdown Editor](/docs/luthor/presets/md-editor/) |
| HTML-focused source workflows | [HTML Editor](/docs/luthor/presets/html-editor/) |
| Slash-command-first authoring | [Slash Editor](/docs/luthor/presets/slash-editor/) |
| Constrained source-mode preset | [Headless Editor Preset](/docs/luthor/presets/headless-editor-preset/) |


