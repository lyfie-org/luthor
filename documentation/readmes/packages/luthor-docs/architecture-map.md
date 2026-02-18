# Core + Preset System Map

## Goal

`src/core` is the universal, reusable foundation.
`src/presets/*` are assembled implementations that choose extension sets, defaults, and final editor UX.

The `extensive` preset is the flagship implementation and consumes all currently available core UI/behavior modules.

## Directory Structure

```text
src/
  core/
    index.ts
    preset-config.ts
    preset-base.css
    types.ts
    commands.ts
    extensions.tsx
    layout.tsx
    ui.tsx
    icons.tsx
    toolbar.tsx
    floating-toolbar.tsx
    command-palette.tsx
    styles.css
  presets/
    extensive/
      index.ts
      preset.ts
      extensions.tsx
      ExtensiveEditor.tsx
      styles.css  (compat shim importing ../../core/styles.css)
    ...other presets
```

## Relationship Model

- `core/preset-config.ts`, `core/preset-base.css`
  - Shared preset foundation moved from `presets/shared` (config factory + base preset styling).
- `core/types.ts`
  - Shared strict TypeScript contracts for command APIs, active states, theme modes, and reusable UI props.
- `core/ui.tsx`, `core/icons.tsx`, `core/layout.tsx`
  - Atomic reusable primitives.
- `core/toolbar.tsx`, `core/floating-toolbar.tsx`, `core/command-palette.tsx`
  - Feature-rich reusable editor UI components.
- `core/commands.ts`
  - Shared command metadata + keyboard shortcut wiring for command-palette/keyboard interoperability.
- `core/extensions.tsx`
  - Floating-toolbar extension bridge and context wiring helper.
- `core/styles.css`
  - Shared style foundation used by presets.

- `presets/extensive/extensions.tsx`
  - Composes headless extensions and binds `core` floating-toolbar bridge.
- `presets/extensive/ExtensiveEditor.tsx`
  - Assembles the final flagship editor shell using `core` components and command utilities.
- `presets/extensive/styles.css`
  - Maintains the original asset path while delegating styles to `core/styles.css`.

## Why this split

- Reduces preset-local duplication.
- Keeps core modules composable for future presets.
- Preserves functional output of `extensive` while making the architecture extensible.
- Keeps preset foundation files out of `src/presets/*` so new developers have one canonical place (`src/core`) for shared building blocks.
