---
title: "Customization Guide"
---

# Customization Guide

This page is retained for compatibility. Canonical docs:

- User configuration guide: [../../../user/luthor/presets-and-configuration.md](/docs/reference/user/luthor/presets-and-configuration/)
- Extensive editor guide: [../../../user/luthor/extensive-editor.md](/docs/reference/user/luthor/extensive-editor/)
- Developer architecture: [../../../developer/luthor/architecture.md](/docs/reference/developer/luthor/architecture/)
- Developer source map: [../../../developer/luthor/source-file-reference.md](/docs/reference/developer/luthor/source-file-reference/)

This guide still includes practical customization patterns.

## 1) Layout Manipulation

### Horizontally center toolbar buttons

`Toolbar` accepts a `classNames` object, so you can provide your own class hooks and center sections with CSS.

```tsx
import { Toolbar } from "@lyfie/luthor";

<Toolbar
  commands={commands}
  hasExtension={hasExtension}
  activeStates={activeStates}
  isDark={isDark}
  toggleTheme={toggleTheme}
  onCommandPaletteOpen={() => commands.showCommandPalette()}
  classNames={{
    toolbar: "my-toolbar",
    section: "my-toolbar-section",
  }}
/>
```

```css
.my-toolbar {
  justify-content: center;
}

.my-toolbar-section {
  justify-content: center;
}
```

### Override mode tab labels

`ModeTabs` supports label overrides:

```tsx
import { ModeTabs } from "@lyfie/luthor";

<ModeTabs
  mode={mode}
  onModeChange={setMode}
  labels={{
    visual: "Editor",
    html: "Source (HTML)",
    markdown: "Source (MD)",
  }}
/>
```

## 2) Theming (colors + styles)

The default extensive/core style layer uses CSS variables. You can override them via wrapper selectors.

```css
.my-editor[data-editor-theme="light"] {
  --luthor-bg: #ffffff;
  --luthor-fg: #111827;
  --luthor-border: #d1d5db;
  --luthor-accent: #111827;
}

.my-editor[data-editor-theme="dark"] {
  --luthor-bg: #0a0a0a;
  --luthor-fg: #f5f5f5;
  --luthor-border: #2a2a2a;
  --luthor-accent: #f5f5f5;
}
```

Use your custom class on the editor wrapper:

```tsx
<ExtensiveEditor className="my-editor" />
```

## 3) Composition: build your own preset from core

You can reuse core modules and wire a custom editor shell:

- `Toolbar` for top actions.
- `FloatingToolbar` via `createFloatingToolbarExtension` + `setFloatingToolbarContext`.
- `CommandPalette` plus `commandsToCommandPaletteItems` and `registerKeyboardShortcuts`.
- `ModeTabs` + `SourceView` for visual/source layout switching.
- `createPresetEditorConfig` for consistent classNames/placeholder wiring in custom preset definitions.

### Example composition flow

1. Create an extension list (choose any subset).
2. Create editor system provider from headless.
3. Use `Toolbar` + `CommandPalette` in your editor shell.
4. Feed command palette items from `commandsToCommandPaletteItems(commands)`.
5. Register keyboard shortcuts with `registerKeyboardShortcuts(commands)`.
6. Share theme/active state with floating toolbar bridge using `setFloatingToolbarContext(...)`.

This gives preset authors full control over feature mix while reusing a stable, typed core implementation.

## 4) Font Select (whitelist + loading strategy)

`fontFamilyExtension` supports a controlled font whitelist and optional CSS loading.

```tsx
import { fontFamilyExtension } from "@lyfie/luthor-headless";

const configuredFontExtension = fontFamilyExtension.configure({
  options: [
    { value: "default", label: "Default", fontFamily: "inherit" },
    {
      value: "inter",
      label: "Inter",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      cssImportUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },
  ],
  cssLoadStrategy: "on-demand", // "none" | "preload-all"
});
```

- `options` is the source of truth for selectable fonts.
- `cssLoadStrategy: "on-demand"` injects `cssImportUrl` only when a font is used.
- `cssLoadStrategy: "preload-all"` eagerly loads all configured font CSS at startup.
