---
title: "@lyfie/luthor-headless Architecture"
description: "Runtime architecture for provider lifecycle, extension registration, commands, and state queries."
package: "headless"
docType: "concept"
surface: "extension"
keywords:
  - "architecture"
  - "Provider"
  - "commands"
  - "activeStates"
  - "stateQueries"
props:
  []
exports:
  - "createEditorSystem"
  - "Extension"
  - "EditorContextType"
commands:
  []
extensions:
  - "createExtension"
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/core/createEditorSystem.tsx"
  - "packages/headless/src/extensions/types.ts"
navGroup: "luthor_headless"
navOrder: 20
---

# @lyfie/luthor-headless Architecture

This page explains how editor runtime state is composed.

## What this page answers

- How does `Provider` assemble extensions?
- How are commands and active states exposed?

## Runtime flow

1. `createEditorSystem` builds typed `Provider` and `useEditor`.
2. Extensions register nodes, plugins, commands, and state queries.
3. `useEditor` exposes `commands`, `activeStates`, `stateQueries`, listeners, and import/export helpers.


