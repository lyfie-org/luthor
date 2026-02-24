# Luthor (`@lyfie/luthor`) Architecture

This document explains how the plug-and-play package is organized, why it is split the way it is, and how it composes `@lyfie/luthor-headless`.

## Package role in the monorepo

`@lyfie/luthor` is the preset-oriented package:

- It provides out-of-the-box editor UIs and preset composition.
- It consumes and re-exports the headless runtime from `@lyfie/luthor-headless`.
- It keeps feature implementation grounded in headless extensions while focusing on UX composition.

## Layered structure

```text
packages/luthor/src/
  index.ts                        # package entrypoint
  core/                           # reusable preset UI + adapters
  presets/                        # concrete preset assemblies
```

### 1) Entrypoint layer

- `src/index.ts`
  - Re-exports `presets/*` and `core/*` public API.
  - Exports `headless` namespace to provide direct access to `@lyfie/luthor-headless` from one package import.

### 2) Core composition layer (`src/core`)

`src/core` contains preset-reusable modules:

- typed command/state contracts (`types.ts`)
- toolbar / floating toolbar / command palette / slash and emoji menus
- command catalog and keyboard shortcut wiring
- source-mode formatting helpers (HTML/Markdown/JSONB)
- preset config helper (`createPresetEditorConfig`)
- adapter that bridges headless floating-toolbar extension with React UI

This layer intentionally avoids hard-coding one preset shell.

### 3) Preset layer (`src/presets`)

`src/presets/extensive/*` provides the flagship preset:

- static preset metadata (`preset.ts`)
- extension stack composition (`extensions.tsx`)
- final editor shell component (`ExtensiveEditor.tsx`)

Other preset modules (`simple-text`, `rich-text-box`, `chat-window`, `email-compose`, `md-text`, `notion-like`, `headless-editor`, `notes`) compose reusable core/headless capabilities with focused UX defaults.

`src/presets/index.ts` exposes a registry model for discoverable presets.

## Data and command flow

1. `ExtensiveEditor` creates an editor system provider using `createEditorSystem`.
2. Headless extensions provide command/state capabilities.
3. `Toolbar` and `FloatingToolbar` consume the typed command surface (`CoreEditorCommands`).
4. `generateCommands` builds command metadata for command palette and slash commands.
5. Keyboard shortcuts are attached via `registerKeyboardShortcuts`.
6. Visual/source mode switching runs import/export conversion routines.

## Why this architecture

- Keeps Lexical-heavy behavior in `@lyfie/luthor-headless`.
- Preserves a reusable UI composition layer for future presets.
- Allows a single package (`@lyfie/luthor`) for plug-and-play adoption.
- Maintains typed boundaries between extension capability and UI rendering.

## Dependency model

From `packages/luthor/package.json`:

- Runtime deps include `@lyfie/luthor-headless` and Lexical packages (`^0.40.0`, `lexical`).
- Icon rendering is handled by internal SVG components in `src/core/icons.tsx`.
- React and React DOM are peers: `^18.0.0 || ^19.0.0`.
- Package version: `2.2.0`.

## Ownership contract (authoritative)

- `@lyfie/luthor` must not introduce new direct Lexical-derived feature behavior in runtime preset source.
- Feature behavior belongs in `@lyfie/luthor-headless`; `@lyfie/luthor` composes, styles, and re-exports.
- If a preset requires new editor semantics, first add a headless API and consume it here.

## How to add a feature safely

Decision tree:

1. Does the change alter Lexical behavior (nodes, commands, selection semantics, parsing)?
   - Yes: implement in `@lyfie/luthor-headless`.
   - No: continue.
2. Is the change about preset UI, layout, default config, or theme ergonomics?
   - Yes: implement in `@lyfie/luthor`.
   - No: continue.
3. Is it cross-cutting?
   - Implement headless behavior first, then wire luthor preset UX.

Required delivery steps:

- Update typed public APIs first.
- Add tests (headless behavior + luthor UX integration).
- Keep docs synchronized in same PR.
- Pass rule-contract, lint, test, and build gates.

## Related documents

- Per-file reference: [source-file-reference.md](source-file-reference.md)
- Maintainer notes: [maintainer-notes.md](maintainer-notes.md)
- User guide: [../../user/luthor/getting-started.md](../../user/luthor/getting-started.md)
- Preset options: [../../user/luthor/presets-and-configuration.md](../../user/luthor/presets-and-configuration.md)
