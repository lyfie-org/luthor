---
title: "Capabilities"
description: "Capability matrix across presets and headless runtime with direct links to command, prop, and extension references."
package: "shared"
docType: "concept"
surface: "tooling"
keywords:
  - "capabilities"
  - "commands"
  - "props"
  - "extensions"
  - "nodes"
props:
  - "maxListIndentation"
  - "languageOptions"
  - "showLineNumbers"
exports:
  - "ExtensiveEditor"
  - "createEditorSystem"
commands:
  - "insert.table"
  - "format.bold"
  - "palette.show"
extensions:
  - "codeIntelligenceExtension"
  - "slashCommandExtension"
  - "youTubeEmbedExtension"
nodes:
  - "iframe-embed"
  - "youtube-embed"
  - "table"
frameworks:
  []
lastVerifiedFrom:
  - "packages/luthor/src/core/commands.ts"
  - "packages/luthor/src/presets/extensive/extensions.tsx"
  - "packages/headless/src/extensions/index.ts"
navGroup: "start_here"
navOrder: 40
---

# Capabilities

This page is a fast map of what the editor stack supports.

## What this page answers

- Which features are available in both packages?
- Where should I look for exact APIs?

## Capability map

| Capability area | Presets (`@lyfie/luthor`) | Runtime (`@lyfie/luthor-headless`) | Source of truth |
| --- | --- | --- | --- |
| Rich text formatting | Yes | Yes | [Commands Reference](/docs/luthor/commands-reference/) |
| Lists, tables, structure | Yes | Yes | [Structure and Lists](/docs/luthor-headless/features/structure-and-lists/) |
| Media embeds | Yes | Yes | [Media and Embeds](/docs/luthor-headless/features/media-and-embeds/) |
| Source modes (JSON/MD/HTML) | Yes | Bridge APIs | [Nodes and Bridges](/docs/luthor-headless/nodes-and-bridges-reference/) |
| Preset-ready UI | Yes | No | [Preset Selector](/docs/reference/preset-selector/) |
| Extension-level control | Limited | Yes | [Extensions Reference](/docs/luthor-headless/extensions-reference/) |


