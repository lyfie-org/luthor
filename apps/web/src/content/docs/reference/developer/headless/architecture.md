---
title: "Headless Architecture (Developer)"
---

# Headless Architecture (Developer)

This document defines how `@lyfie/luthor-headless` is structured, why key design choices exist, and how contributors should extend it safely.

## Goals

- Keep the package headless and lightweight.
- Keep Lexical integrations in `@lyfie/luthor-headless` (not in presets).
- Preserve type-safe command/state composition across arbitrary extension sets.
- Support lossless import/export flows (JSON/JSONB).

## Runtime Layers

1. `src/core/*`
   - Editor runtime factory (`createEditorSystem`) and context wiring.
   - Extension factory (`createExtension`) for low-boilerplate extension authoring.
   - Theme contracts and merge helpers.
2. `src/extensions/*`
   - Feature modules (formatting, media, core UX, custom nodes).
   - Canonical extension type contracts in `src/extensions/types.ts`.
3. `src/utils/*`
   - Runtime utility surface for JSON/JSONB-first integrations.

## Why the extension model looks this way

- Extension arrays are declared `as const` so TypeScript can infer literal extension names and produce precise command/state types.
- `createEditorSystem<Extensions>()` extracts and merges command/state query types from every extension.
- `BaseExtension` and `createExtension` both exist:
  - `BaseExtension`: best for complex, stateful, class-style extensions.
  - `createExtension`: best for straightforward extensions without class boilerplate.

## Lifecycle and composition

- Extensions can provide:
  - `getNodes()` for Lexical nodes
  - `getPlugins()` for React plugins
  - `getCommands()` for mutation APIs
  - `getStateQueries()` for async active state checks
  - `onInitialize()` for setup/cleanup
- `createEditorSystem` composes these contributions and resolves collisions deterministically through extension order and initialization priority.

## Import / export strategy

- JSON remains the source-of-truth round-trip format for exact editor state.
- JSONB is the recommended persistence target for production databases.

## Contribution rules for this package

- Keep dependencies minimal; optional integrations must degrade gracefully when absent.
- Place any Lexical-derived feature logic in `packages/headless` and re-export from presets.
- Keep extension APIs explicit and strongly typed.
- Favor additive extension configs over hidden global behavior.
