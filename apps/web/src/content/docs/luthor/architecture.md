---
title: Architecture
description: How @lyfie/luthor is structured internally, how presets compose headless extensions, and where to contribute.
---

# @lyfie/luthor Architecture

`@lyfie/luthor` is a preset layer on top of `@lyfie/luthor-headless`. It packages curated extension bundles, ready-made UI, and source-mode workflows.

## High-level flow

1. A preset component (for example `ExtensiveEditor`) resolves feature flags and options.
2. The preset builds an extension array with `createExtensiveExtensions(...)`.
3. It mounts a typed headless `Provider` created with `createEditorSystem(...)`.
4. UI components (toolbar, tabs, source panel, slash/palette overlays) call typed editor commands.
5. Source modes convert through `jsonToMarkdown` / `markdownToJSON` and `jsonToHTML` / `htmlToJSON`.

## Key directories

- `packages/luthor/src/presets/extensive`: base preset, extension assembly, and default UX.
- `packages/luthor/src/presets/*`: wrappers around `ExtensiveEditor` (Compose, Simple, Slash, MD, HTML, Legacy, Headless preset).
- `packages/luthor/src/presets/_shared`: shared preset policy, feature guards, mode cache, and style-var helpers.
- `packages/luthor/src/core`: reusable UI pieces (toolbar, command palette, slash menu, source view, command registry, shortcut system).

## Preset composition model

1. `ExtensiveEditor` is the base runtime.
2. Wrapper presets set constrained `availableModes`.
3. Wrapper presets apply preset defaults and optional overrides via `featureFlags`.
4. Wrapper presets optionally enforce fixed flags with `PresetFeaturePolicy`.
5. Wrapper presets tune toolbar layouts and class names.

This keeps behavior centralized while allowing focused preset surfaces.

## Feature policy model

`PresetFeaturePolicy` merges:

1. preset defaults,
2. user overrides,
3. enforced flags (cannot be turned back on).

This is why presets such as `LegacyRichEditor` keep metadata-heavy features disabled even when overrides are passed.

## Source mode behavior

`ExtensiveEditor` supports:

- visual modes: `visual-editor`, `visual-only`, plus the legacy alias `visual`
- source modes: `json`, `markdown`, `html`

Source values are synchronized and validated on mode switches. Conversion errors are isolated to source mode and do not silently overwrite visual content.

## Extension and theme wiring

- Extensions are memoized from normalized config keys to avoid stale editor wiring.
- Theme tokens use `createEditorThemeStyleVars(...)` plus CSS custom properties.
- `defaultSettings` maps common style values (font, list marker, quote, table, placeholder, code block, toolbar) to CSS vars.

## Contributor entry points

- Add new preset behavior: `packages/luthor/src/presets/extensive/ExtensiveEditor.tsx`
- Add or adjust feature flags: `packages/luthor/src/presets/extensive/extensions.tsx`
- Add shared preset utilities: `packages/luthor/src/presets/_shared`
- Add commands and shortcuts: `packages/luthor/src/core/commands.ts`
