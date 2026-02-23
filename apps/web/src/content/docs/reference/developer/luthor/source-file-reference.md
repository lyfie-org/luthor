---
title: "Luthor Source File Reference (`packages/luthor/src`)"
---

# [Luthor](/demo/) Source File Reference (`packages/luthor/src`)

This file documents every code file in `packages/luthor/src`.

## Inventory

- Total files: **21**
- Scope: all `.ts` and `.tsx` files under `packages/luthor/src`

## Root entrypoints

### `packages/luthor/src/index.ts`

- Purpose: package root entrypoint.
- Exports:
  - all exports from `./presets`
  - all exports from `./core`
  - namespace export `headless` from `@lyfie/luthor-headless`
- Notes:
  - Enables one-package import ergonomics.

## Core layer (`packages/luthor/src/core`)

### `core/index.ts`

- Purpose: barrel for all core modules.
- Exports:
  - commands, extension adapters, UI components, types, formatting helpers.

### `core/types.ts`

- Purpose: typed contract layer between UI and editor capabilities.
- Exports:
  - mode/format unions, insert configs, command/state interfaces, class-name maps.
- Notes:
  - Most command methods are optional to support extension-gated capabilities.

### `core/preset-config.ts`

- Purpose: helper to create consistent preset config values.
- Exports:
  - `createPresetEditorConfig`.
- Key behavior:
  - Builds class names and placeholder defaults by preset id.

### `core/extensions.tsx`

- Purpose: floating-toolbar extension bridge.
- Exports:
  - `setFloatingToolbarContext`
  - `createFloatingToolbarExtension`
- Key behavior:
  - Maintains mutable context used by headless floating-toolbar extension render lifecycle.

### `core/commands.ts`

- Purpose: canonical command catalog and keyboard registration.
- Exports:
  - `generateCommands`
  - `commandsToCommandPaletteItems`
  - `commandsToSlashCommandItems`
  - `registerKeyboardShortcuts`
  - types `KeyboardShortcut`, `CommandConfig`
- Key behavior:
  - Creates command metadata with extension-aware availability checks.
  - Converts command definitions into palette/slash UI item shapes.
  - Registers global keyboard shortcuts with conflict handling.

### `core/command-palette.tsx`

- Purpose: command palette modal UI.
- Exports:
  - `CommandPalette` component.
- Key behavior:
  - Query filtering, category grouping, keyboard navigation/selection, escape close.

### `core/slash-command-menu.tsx`

- Purpose: slash-command popup UI.
- Exports:
  - `SlashCommandMenu` component.
- Key behavior:
  - Anchored popup, query filtering, grouped command list, keyboard navigation.

### `core/emoji-suggestion-menu.tsx`

- Purpose: emoji suggestion popup UI.
- Exports:
  - `EmojiSuggestionMenu` component.
- Key behavior:
  - Search by label/shortcode/keywords, anchored rendering, keyboard navigation.

### `core/source-format.ts`

- Purpose: source text formatting utilities.
- Exports:
  - `formatJSONBSource`
- Key behavior:
  - JSON parse/stringify fallback formatting.

### `core/layout.tsx`

- Purpose: source/visual mode layout primitives.
- Exports:
  - `ModeTabs`
  - `SourceView`
- Key behavior:
  - Optional mode labels and mode filtering.
  - Source textarea autosizing.

### `core/ui.tsx`

- Purpose: low-level shared UI primitives for core controls.
- Exports:
  - `IconButton`, `Button`, `Select`, `Dropdown`, `Dialog`
- Key behavior:
  - Dropdown positioning, outside click handling, dialog escape handling and scroll lock.

### `core/icons.tsx`

- Purpose: icon mapping layer.
- Exports:
  - editor-oriented icon aliases backed by `lucide-react`.

### `core/floating-toolbar.tsx`

- Purpose: contextual floating toolbar.
- Exports:
  - `FloatingToolbar`
  - `FloatingToolbarProps`
- Key behavior:
  - Renders text/media actions depending on current selection context.

### `core/toolbar.tsx`

- Purpose: main top toolbar UI for preset editor.
- Exports:
  - `Toolbar`
  - `ToolbarProps`
- Key behavior:
  - Extension-aware control rendering.
  - typography/color/image/embed/table controls.
  - command palette trigger and theme controls.

### `core/code-intelligence-extension.ts`

- Purpose: re-export shim for code intelligence extension.
- Exports:
  - `CodeIntelligenceExtension`
  - `codeIntelligenceExtension`
  - `CodeIntelligenceCommands`
- Source:
  - forwarded from `@lyfie/luthor-headless`.

## Preset layer (`packages/luthor/src/presets`)

### `presets/index.ts`

- Purpose: preset API and registry.
- Exports:
  - `EditorPreset` interface
  - `createPresetEditorConfig`
  - extensive preset exports
  - `presetRegistry`
- Key behavior:
  - Registers `extensive` as the built-in preset key.

### `presets/extensive/index.ts`

- Purpose: barrel for extensive preset modules.
- Exports:
  - `extensivePreset`, `extensiveToolbar`, `extensiveExtensions`, `ExtensiveEditor`, extensive editor types.

### `presets/extensive/preset.ts`

- Purpose: static extensive preset metadata.
- Exports:
  - `extensiveToolbar`
  - `extensivePreset`
- Key behavior:
  - Defines toolbar defaults, base config, css path, editor component reference.

### `presets/extensive/extensions.tsx`

- Purpose: extension composition for extensive preset.
- Exports:
  - `setFloatingToolbarContext` (re-export)
  - `extensiveImageExtension`
  - `extensiveExtensions`
  - `ExtensiveExtensions` type
- Key behavior:
  - Composes most built-in headless extensions.
  - Applies configuration for embeds, image handling, typography/color options, and custom node behavior.

### `presets/extensive/ExtensiveEditor.tsx`

- Purpose: fully assembled preset editor component.
- Exports:
  - `ExtensiveEditor`
  - `ExtensiveEditorMode`, `ExtensiveEditorRef`, `ExtensiveEditorProps`
- Key behavior:
  - Creates editor system provider and command wiring.
  - Integrates toolbar, floating toolbar, slash menu, emoji menu, and command palette.
  - Supports visual/JSONB mode switching with conversion and validation.
  - Exposes imperative ref methods.

## Cross-file relationships

- Command model source of truth: `core/commands.ts`
- UI contracts: `core/types.ts`
- Floating toolbar extension bridge: `core/extensions.tsx`
- Preset assembly:
  - extension stack: `presets/extensive/extensions.tsx`
  - metadata: `presets/extensive/preset.ts`
  - runtime shell: `presets/extensive/ExtensiveEditor.tsx`

## Contributor checklist for source changes

When modifying any file in `packages/luthor/src`:

1. Update this file’s section if exports/responsibilities change.
2. Update user docs if public behavior changed.
3. Update `packages/luthor/README.md` for API surface changes.
4. Run package lint/build checks.
