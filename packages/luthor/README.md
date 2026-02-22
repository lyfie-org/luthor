# @lyfie/luthor

Plug-and-play preset package built on top of `@lyfie/luthor-headless`.

## Package scope

- Provides out-of-the-box editor presets and pre-composed UX.
- Depends on and composes `@lyfie/luthor-headless`.
- Re-exports headless capabilities for teams that want one package entrypoint.

## Version and compatibility

- Package version: `2.2.0`
- React peer dependencies: `^18.0.0 || ^19.0.0`
- Lexical dependencies are included directly in this package (`^0.40.0` family).
- Icon dependency: `lucide-react ^0.475.0`

## Installation

```bash
pnpm add @lyfie/luthor react react-dom
```

## Quick start

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Toolbar placement and alignment

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      toolbarPosition="bottom"
      toolbarAlignment="center"
      toolbarVisibility={{ embed: false, themeToggle: false }}
    />
  );
}
```

## Toolbar style customization (TSX + CSS)

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      toolbarClassName="docs-toolbar"
      editorThemeOverrides={{
        "--luthor-bg": "#fffaf2",
        "--luthor-fg": "#431407",
        "--luthor-accent": "#c2410c",
      }}
      toolbarStyleVars={{
        "--luthor-toolbar-button-active-bg": "#ea580c",
        "--luthor-toolbar-button-active-fg": "#ffffff",
      }}
    />
  );
}
```

```css
/* CSS-only override pattern */
.docs-toolbar {
  --luthor-toolbar-bg: color-mix(in srgb, #fff7ed 75%, white 25%);
  --luthor-toolbar-section-border: #fdba74;
  --luthor-toolbar-button-fg: #7c2d12;
  --luthor-toolbar-button-hover-bg: #ffedd5;
  --luthor-toolbar-button-hover-border: #fb923c;
  --luthor-toolbar-button-active-bg: #ea580c;
  --luthor-toolbar-button-active-border: #ea580c;
  --luthor-toolbar-button-active-fg: #ffffff;
}
```

- `toolbarPosition`: `"top"` (default) or `"bottom"`
- `toolbarAlignment`: `"left"` (default), `"center"`, or `"right"`
- `isToolbarEnabled`: `true` (default). Set `false` to hide the primary toolbar while keeping keyboard shortcuts, slash commands, and command palette support.
- `toolbarVisibility`: `Partial<Record<ToolbarItemType, boolean>>`. Set an item to `false` to hide it; unsupported items are auto-hidden even if set to `true`.
- `toolbarClassName`: optional class appended to the toolbar root (`.luthor-toolbar`) for CSS overrides.
- `toolbarStyleVars`: optional map of `--luthor-toolbar-*` custom properties applied to the toolbar root.
- `editorThemeOverrides`: optional map of `--luthor-*` custom properties applied to the editor wrapper for per-instance theme injection.
- `theme`: optional `Partial<LuthorTheme>` merged into the editor theme config.
- `quoteClassName`: optional class appended to the quote node class (default base class is `.luthor-quote`).
- `quoteStyleVars`: optional map of `--luthor-quote-*` custom properties applied to the editor wrapper.
- `fontFamilyOptions`: optional per-editor font-family option list for the `fontFamily` toolbar select.
- `fontSizeOptions`: optional per-editor font-size option list for the `fontSize` toolbar select.
- `lineHeightOptions`: optional per-editor line-height option list for the `lineHeight` toolbar select. Non-default options should use unitless numeric ratios (for example `"1.5"`).
- `headingOptions`: optional heading level list for the block format dropdown (`h1`-`h6`).
- `paragraphLabel`: optional paragraph label override for the block format dropdown (for example `"Normal"`).
- `syncHeadingOptionsWithCommands`: `true` by default. Set `false` to keep slash/command-palette/keyboard heading commands independent from `headingOptions`.

### Font family options

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      fontFamilyOptions={[
        { value: "default", label: "Default", fontFamily: "inherit" },
        {
          value: "geist",
          label: "Geist",
          fontFamily: "'Geist', 'Segoe UI', Arial, sans-serif",
          cssImportUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&display=swap",
        },
      ]}
    />
  );
}
```

### Font size options

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      fontSizeOptions={[
        { value: "default", label: "Default", fontSize: "inherit" },
        { value: "13", label: "13px", fontSize: "13px" },
        { value: "17", label: "17px", fontSize: "17px" },
        { value: "21", label: "21px", fontSize: "21px" },
      ]}
    />
  );
}
```

### Line height options

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      lineHeightOptions={[
        { value: "default", label: "Default", lineHeight: "normal" },
        { value: "1.3", label: "1.3", lineHeight: "1.3" },
        { value: "1.6", label: "1.6", lineHeight: "1.6" },
        { value: "2", label: "2.0", lineHeight: "2" },
      ]}
    />
  );
}
```

Toolbar CSS variable contract:
- `--luthor-toolbar-bg`
- `--luthor-toolbar-section-border`
- `--luthor-toolbar-button-fg`
- `--luthor-toolbar-button-hover-bg`
- `--luthor-toolbar-button-hover-border`
- `--luthor-toolbar-button-hover-shadow`
- `--luthor-toolbar-button-press-shadow`
- `--luthor-toolbar-button-active-bg`
- `--luthor-toolbar-button-active-border`
- `--luthor-toolbar-button-active-fg`
- `--luthor-toolbar-button-active-shadow`
- `--luthor-toolbar-button-overlay`
- `--luthor-toolbar-button-active-overlay`
- `--luthor-toolbar-color-indicator-border`
- `--luthor-toolbar-highlight-bg`

Editor theme CSS variable contract (`editorThemeOverrides`):
- `--luthor-bg`
- `--luthor-fg`
- `--luthor-border`
- `--luthor-border-hover`
- `--luthor-border-active`
- `--luthor-accent`
- `--luthor-accent-hover`
- `--luthor-shadow`
- `--luthor-muted`
- `--luthor-muted-fg`
- `--luthor-theme-transition`
- `--luthor-drag-gutter-width`
- `--luthor-line-height-ratio`
- `--luthor-toolbar-bg`
- `--luthor-toolbar-section-border`
- `--luthor-toolbar-button-fg`
- `--luthor-toolbar-button-hover-bg`
- `--luthor-toolbar-button-hover-border`
- `--luthor-toolbar-button-hover-shadow`
- `--luthor-toolbar-button-press-shadow`
- `--luthor-toolbar-button-active-bg`
- `--luthor-toolbar-button-active-border`
- `--luthor-toolbar-button-active-fg`
- `--luthor-toolbar-button-active-shadow`
- `--luthor-toolbar-button-overlay`
- `--luthor-toolbar-button-active-overlay`
- `--luthor-toolbar-color-indicator-border`
- `--luthor-toolbar-highlight-bg`
- `--luthor-quote-bg`
- `--luthor-quote-fg`
- `--luthor-quote-border`
- `--luthor-syntax-comment`
- `--luthor-syntax-keyword`
- `--luthor-syntax-string`
- `--luthor-syntax-number`
- `--luthor-syntax-function`
- `--luthor-syntax-variable`
- `--luthor-floating-bg`
- `--luthor-floating-fg`
- `--luthor-floating-border`
- `--luthor-floating-shadow`
- `--luthor-floating-muted`
- `--luthor-floating-border-hover`
- `--luthor-floating-border-active`
- `--luthor-floating-accent`
- `--luthor-floating-accent-fg`
- `--luthor-preset-bg`
- `--luthor-preset-fg`
- `--luthor-preset-border`
- `--luthor-preset-muted`
- `--luthor-preset-muted-fg`
- `--luthor-preset-accent`
- `--luthor-preset-radius`
- `--luthor-preset-shadow`
- `--luthor-preset-content-padding`
- `--luthor-preset-content-min-height`

## Quote style customization (TSX + CSS)

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

export function App() {
  return (
    <ExtensiveEditor
      quoteClassName="docs-quote"
      quoteStyleVars={{
        "--luthor-quote-bg": "#fff7ed",
        "--luthor-quote-fg": "#7c2d12",
        "--luthor-quote-border": "#ea580c",
      }}
      theme={{
        quote: "docs-quote-theme",
      }}
    />
  );
}
```

```css
/* Class override API */
.docs-quote,
.docs-quote-theme {
  border-left-width: 6px;
  border-radius: 0 8px 8px 0;
}
```

Quote CSS variable contract:
- `--luthor-quote-bg`
- `--luthor-quote-fg`
- `--luthor-quote-border`

## Primary exports

- Presets: `extensivePreset`
- Preset registry: `presetRegistry`
- Ready component: `ExtensiveEditor`
- Shared extension bundle: `extensiveExtensions`
- Preset config helper: `createPresetEditorConfig`
- Headless passthrough namespace: `headless`

## Headless access from this package

```tsx
import { headless } from "@lyfie/luthor";

const { createEditorSystem, boldExtension } = headless;
```

## Extensive preset capabilities

- rich text and formatting controls
- command palette and slash commands
- floating toolbar and context-aware actions
- media support (image, iframe, YouTube)
- visual/source modes with conversions (`visual`, `html`, `markdown`, `jsonb`)

## Which package should you use?

- Use `@lyfie/luthor` if you want fast setup and opinionated defaults.
- Use `@lyfie/luthor-headless` if you want full control over extension selection and UI composition.

## Documentation

Canonical docs root: [../../documentation/index.md](../../documentation/index.md)

### User docs

- Luthor getting started: [../../documentation/user/luthor/getting-started.md](../../documentation/user/luthor/getting-started.md)
- Presets and configuration: [../../documentation/user/luthor/presets-and-configuration.md](../../documentation/user/luthor/presets-and-configuration.md)
- Extensive editor guide: [../../documentation/user/luthor/extensive-editor.md](../../documentation/user/luthor/extensive-editor.md)

### Developer docs

- Luthor architecture: [../../documentation/developer/luthor/architecture.md](../../documentation/developer/luthor/architecture.md)
- Luthor source-file reference: [../../documentation/developer/luthor/source-file-reference.md](../../documentation/developer/luthor/source-file-reference.md)
- Luthor maintainer notes: [../../documentation/developer/luthor/maintainer-notes.md](../../documentation/developer/luthor/maintainer-notes.md)

### Related docs

- Monorepo README: [../../README.md](../../README.md)
- Headless package README: [../headless/README.md](../headless/README.md)
- Legacy luthor docs redirects: [../../documentation/readmes/packages/luthor-docs/README.md](../../documentation/readmes/packages/luthor-docs/README.md)
- Demo getting started: [../../documentation/user/demo/getting-started.md](../../documentation/user/demo/getting-started.md)
- Demo architecture: [../../documentation/developer/demo/architecture.md](../../documentation/developer/demo/architecture.md)

## Workspace development

From repository root:

```bash
pnpm --filter @lyfie/luthor dev
pnpm --filter @lyfie/luthor build
pnpm --filter @lyfie/luthor lint
```
