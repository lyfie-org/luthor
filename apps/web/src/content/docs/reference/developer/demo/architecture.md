---
title: "Demo App Architecture (`apps/demo`)"
---

# Demo App Architecture (`apps/demo`)

This document explains how the demo app is structured and how it validates `@lyfie/luthor` and `@lyfie/luthor-headless` behavior.

## Purpose

The demo app is a focused Vite + React sandbox used to:

- exercise the extensive preset in a real app shell
- validate import/export and persistence flows
- provide a reproducible environment for contributor debugging

## Runtime entry flow

Browser app flow:

1. `index.html` mounts `#root`.
2. `src/main.tsx` bootstraps React and renders `App`.
3. `src/App.tsx` composes all demo panels and the `ExtensiveEditor` instance.

Worker/deploy flow:

- `src/index.ts` is the Cloudflare Worker entry.
- `wrangler.jsonc` points `main` at `./src/index.ts` for deploys.

## App composition

`src/App.tsx` orchestrates:

- `DemoTopBar`
- `ShowcaseHero`
- `FeatureCoveragePanel`
- `PersistencePanel`
- `EditorPlayground` containing `ExtensiveEditor`

The app keeps behavior clear by separating display-only components from editor-bridge logic.

## Editor bridge model

The integration uses `ExtensiveEditorRef` methods to control content and persistence:

- `injectJSONB(...)`
- `getJSONB()`

This keeps demo operations aligned with real consumer integration patterns.

## Data and state design

### Seed and feature taxonomy

`src/data/demoContent.ts` provides:

- JSONB scenario payload
- extension-to-category maps used by feature panels

### UI state in `App`

Primary app state includes:

- theme mode (`light` / `dark`)
- payload textarea value
- persistence status messages
- copy status feedback

Theme is stored in local storage; persistence payload is intentionally user-driven via panel actions.

## Configuration layer

- `vite.config.ts`: React + Cloudflare plugin setup.
- `tsconfig*.json`: strict TS and project references.
- `eslint.config.js`: lint setup for React/TS hooks and refresh rules.
- `wrangler.jsonc`: worker name/date/main for deploy path.

## Contributor notes

- Demo behavior should mirror package public APIs, not private internals.
- Keep demo components small and focused on showcasing capabilities.
- Update source-file docs whenever demo files are added/removed.

## Related docs

- Demo source file reference: [source-file-reference.md](/docs/reference/developer/demo/source-file-reference/)
- Demo maintainer notes: [maintainer-notes.md](/docs/reference/developer/demo/maintainer-notes/)
- Demo user guide: [../../user/demo/getting-started.md](/docs/reference/user/demo/getting-started/)
