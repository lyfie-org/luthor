---
title: "Demo Source File Reference (`apps/demo`)"
---

# Demo Source File Reference (`apps/demo`)

This is the canonical per-file reference for the demo app.

## Inventory

- Total files documented: **28**
- Scope: app config, source code, static assets, and wrangler deploy metadata under `apps/demo`

## Root-level files

### `apps/demo/.gitignore`

- Purpose: keeps local/build artifacts out of version control.
- Key entries: `node_modules`, `dist`, log files, local editor settings.

### `apps/demo/eslint.config.js`

- Purpose: lint configuration for the demo app.
- Behavior: applies JS/TS React lint rules and ignores generated output.

### `apps/demo/index.html`

- Purpose: browser shell for Vite app.
- Behavior: defines root mount node and loads `src/main.tsx` module.

### `apps/demo/package.json`

- Purpose: app metadata, scripts, dependency declarations.
- Scripts: `dev`, `build`, `lint`, `preview`, `deploy`.

### `apps/demo/tsconfig.json`

- Purpose: TS solution file with references and path aliases.
- Behavior: delegates app/node settings to referenced tsconfig files.

### `apps/demo/tsconfig.app.json`

- Purpose: strict TypeScript settings for browser app source.
- Behavior: no-emit compile checks, bundler-mode module resolution.

### `apps/demo/tsconfig.node.json`

- Purpose: node-side TypeScript config for Vite config typing.

### `apps/demo/vite.config.ts`

- Purpose: Vite configuration.
- Behavior: wires React plugin and Cloudflare Vite plugin.

### `apps/demo/wrangler.jsonc`

- Purpose: Cloudflare Worker deployment config.
- Behavior: sets worker name, compatibility date, and entry file (`src/index.ts`).

## Wrangler-generated metadata

### `apps/demo/.wrangler/deploy/config.json`

- Purpose: generated Wrangler deploy metadata.
- Note: not app logic; references generated deploy config paths.

## Public/static assets

### `apps/demo/public/logo.svg`

- Purpose: static favicon asset.

## Source runtime files

### `apps/demo/src/main.tsx`

- Purpose: React runtime bootstrap.
- Behavior: mounts `<App />` into DOM root.

### `apps/demo/src/App.tsx`

- Purpose: main orchestration component.
- Behavior:
  - composes demo UI sections
  - wires `ExtensiveEditor` ref actions
  - handles markdown/JSONB load-save-copy workflows
  - computes grouped feature coverage from extension list
  - manages theme and status states

### `apps/demo/src/index.ts`

- Purpose: Cloudflare Worker entry module.
- Behavior: exports `fetch` handler response for worker runtime.

### `apps/demo/src/data/demoContent.ts`

- Purpose: demo content and feature taxonomy constants.
- Exports:
  - seeded markdown content
  - JSONB scenario object
  - extension categorization maps and ordering

## Component files

### `apps/demo/src/components/DemoTopBar.tsx`

- Purpose: top control bar.
- Behavior: theme toggle and demo-content loading trigger.

### `apps/demo/src/components/ShowcaseHero.tsx`

- Purpose: summary hero panel.
- Behavior: displays capability metrics and category highlights.

### `apps/demo/src/components/FeatureCoveragePanel.tsx`

- Purpose: extension capability visualization.
- Behavior: renders grouped feature chips and copy-markdown action.

### `apps/demo/src/components/PersistencePanel.tsx`

- Purpose: persistence testing UI.
- Behavior: payload textarea + save/load/restore/copy action controls.

### `apps/demo/src/components/EditorPlayground.tsx`

- Purpose: visual container for editor surface.
- Behavior: provides layout wrapper around editor content.

## CSS/style files

### `apps/demo/src/index.css`

- Purpose: baseline global styles.
- Behavior: body/root defaults and theme-aware globals.

### `apps/demo/src/App.css`

- Purpose: CSS entrypoint for app-level stylesheet imports.
- Behavior: imports style modules in controlled order.

### `apps/demo/src/styles/app-shell.css`

- Purpose: app shell variables and generic surface/button styles.

### `apps/demo/src/styles/topbar.css`

- Purpose: top bar layout and controls styling.

### `apps/demo/src/styles/hero.css`

- Purpose: showcase hero panel styling.

### `apps/demo/src/styles/features.css`

- Purpose: feature/persistence panel and chip grid styling.

### `apps/demo/src/styles/editor-playground.css`

- Purpose: editor stage and container styling.

## Contributor checklist

When touching `apps/demo` files:

1. Keep this per-file reference updated.
2. Update demo user docs for changed run or usage flows.
3. Verify README and documentation index links still resolve.
4. Run demo lint/build checks.
