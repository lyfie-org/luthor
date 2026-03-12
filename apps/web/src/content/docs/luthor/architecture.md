---
title: Architecture
description: How @lyfie/luthor is structured internally, how presets compose headless extensions, and where to contribute.
---

# @lyfie/luthor Architecture

`@lyfie/luthor` is the preset layer on top of `@lyfie/luthor-headless`.  
It gives you ready-made editor components, while still using typed extension composition under the hood.

## High-level flow

1. A preset component (for example `ExtensiveEditor`) receives props.
2. Preset policy resolves allowed feature flags.
3. `createExtensiveExtensions(...)` builds the exact extension array.
4. A typed headless provider (`createEditorSystem(...)`) mounts those extensions.
5. Preset UI (toolbar, tabs, overlays, source panels) calls typed command APIs.
6. Source mode conversions run through JSON:
   - `jsonToMarkdown` / `markdownToJSON`
   - `jsonToHTML` / `htmlToJSON`

## Key directories

- `packages/luthor/src/presets/extensive`: base preset, extension assembly, and default UX.
- `packages/luthor/src/presets/*`: wrappers around `ExtensiveEditor` (Compose, Simple, Slash, MD, HTML, Legacy, Headless preset).
- `packages/luthor/src/presets/_shared`: shared preset policy, feature guards, mode cache, and style-var helpers.
- `packages/luthor/src/core`: toolbar, command palette, slash menu, source view, command registry, shortcuts, and layout helpers.

## Preset composition model

1. `ExtensiveEditor` is the base runtime.
2. Wrapper presets set constrained `availableModes`.
3. Wrapper presets apply preset defaults and optional overrides via `featureFlags`.
4. Wrapper presets enforce fixed flags with `PresetFeaturePolicy` when needed.
5. Wrapper presets tune toolbar layouts and class names.

This design keeps behavior centralized while exposing focused preset APIs.

## Feature policy model

`PresetFeaturePolicy` merges:

1. preset defaults,
2. user overrides,
3. enforced flags (cannot be turned back on).

That is why presets like `LegacyRichEditor` keep metadata-heavy features disabled even when overrides are passed.

## Source mode behavior

`ExtensiveEditor` supports:

- visual modes:
  - `visual-editor`: editable visual surface
  - `visual-only`: read-focused visual surface with optional click-to-edit (`editOnClick`)
  - `visual`: legacy alias that maps to `visual-editor`
- source modes: `json`, `markdown`, `html`

Mode switches validate source input before applying changes.  
If conversion fails, an explicit source error is shown and visual content is not silently replaced.

## Extension and theme wiring

- Extensions are memoized from normalized config keys to avoid stale wiring.
- Theme tokens use `createEditorThemeStyleVars(...)` plus CSS custom properties.
- `defaultSettings` maps common style values (font, list marker, quote, table, placeholder, code block, toolbar) to CSS vars.

## Keyboard, command, and search surfaces

- Toolbar actions map to command methods in `CoreEditorCommands`.
- Command palette and slash commands are generated from the same command definitions.
- Shortcut behavior is configurable through `shortcutConfig`, with collision and native-conflict guards.
- Docs search in `apps/web` indexes titles, descriptions, body text, and code snippets from every docs page.

## Contributor entry points

- Add new preset behavior: `packages/luthor/src/presets/extensive/ExtensiveEditor.tsx`
- Add or adjust feature flags: `packages/luthor/src/presets/extensive/extensions.tsx`
- Add shared preset utilities: `packages/luthor/src/presets/_shared`
- Add commands and shortcuts: `packages/luthor/src/core/commands.ts`
