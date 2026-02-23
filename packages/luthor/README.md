# @lyfie/luthor

Plug-and-play React editor preset package built on top of `@lyfie/luthor-headless`.

## Installation

```bash
pnpm add @lyfie/luthor react react-dom
```

## Quick Start

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## What This Package Exposes

- Preset editor component: `ExtensiveEditor`
- Preset builder helpers: `extensivePreset`, `createExtensivePreset`, `presetRegistry`
- Extension composition helpers: `createExtensiveExtensions`, `extensiveExtensions`
- Feature flag helpers: `resolveFeatureFlags`, `isFeatureEnabled`, `DEFAULT_FEATURE_FLAGS`
- Core UI + command utilities: `Toolbar`, `FloatingToolbar`, `generateCommands`, `registerKeyboardShortcuts`, and more
- Full headless passthrough namespace: `headless`

```tsx
import { headless } from "@lyfie/luthor";

const { createEditorSystem, richTextExtension, boldExtension } = headless;
```

## ExtensiveEditor API

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `className` | `string` | `undefined` | Appended to wrapper root. |
| `variantClassName` | `string` | `undefined` | Extra preset variant class on wrapper. |
| `onReady` | `(methods: ExtensiveEditorRef) => void` | `undefined` | Called when editor methods are ready. |
| `initialTheme` | `"light" \| "dark"` | `"light"` | Initial visual theme mode. |
| `theme` | `Partial<LuthorTheme>` | `undefined` | Theme class/style overrides merged with default theme. |
| `defaultContent` | `string` | `undefined` | If provided, injected as initial content (JSON parsed or plain text converted to JSONB). |
| `showDefaultContent` | `boolean` | `true` | If `true` and `defaultContent` is not provided, loads built-in welcome content. |
| `placeholder` | `string \| { visual?: string; jsonb?: string }` | `"Write anything..."` | String applies to visual mode; object lets you set visual and JSONB placeholders separately. |
| `initialMode` | `"visual" \| "jsonb"` | `"visual"` | Initial open mode; clamped to `availableModes`. |
| `availableModes` | `readonly ("visual" \| "jsonb")[]` | `["visual", "jsonb"]` | Visible mode tabs and allowed switching targets. |
| `toolbarLayout` | `ToolbarLayout` | `TRADITIONAL_TOOLBAR_LAYOUT` | Custom toolbar sections/items order. |
| `toolbarVisibility` | `Partial<Record<ToolbarItemType, boolean>>` | `undefined` | Per-item hide/show map. Unsupported items are auto-hidden. |
| `toolbarPosition` | `"top" \| "bottom"` | `"top"` | Renders toolbar above or below visual editor. |
| `toolbarAlignment` | `"left" \| "center" \| "right"` | `"left"` | Horizontal toolbar alignment class. |
| `toolbarClassName` | `string` | `undefined` | Extra class for toolbar root (`.luthor-toolbar`). |
| `toolbarStyleVars` | `ToolbarStyleVars` | `undefined` | Inline `--luthor-toolbar-*` CSS variable overrides. |
| `isToolbarEnabled` | `boolean` | `true` | Hides toolbar UI only; keyboard/commands still exist unless feature-flagged off. |
| `quoteClassName` | `string` | `undefined` | Appended to quote node class. |
| `quoteStyleVars` | `QuoteStyleVars` | `undefined` | Inline `--luthor-quote-*` CSS variable overrides. |
| `defaultSettings` | `DefaultSettings` | `undefined` | High-level style token API for common color settings. |
| `editorThemeOverrides` | `LuthorEditorThemeOverrides` | `undefined` | Inline editor-wide `--luthor-*` token overrides. |
| `fontFamilyOptions` | `readonly FontFamilyOption[]` | preset defaults | Sanitized: duplicates removed, invalid tokens removed, `default` auto-added if missing. |
| `fontSizeOptions` | `readonly FontSizeOption[]` | preset defaults | Sanitized similarly to font family options. |
| `minimumDefaultLineHeight` | `string \| number` | `1.5` | Sets the editor default line height and the minimum selectable/accepted line-height floor for the line-height feature; minimum accepted value is `1.0`. |
| `lineHeightOptions` | `readonly LineHeightOption[]` | preset defaults | Uses unitless ratios (`"1.5"`) for non-default values; minimum allowed is `1.0`. |
| `scaleByRatio` | `boolean` | `false` | Image resize behavior (`true` = keep ratio by default, Shift unlocks). |
| `headingOptions` | `readonly ("h1"\|"h2"\|"h3"\|"h4"\|"h5"\|"h6")[]` | all headings | Invalid/duplicate entries are removed. |
| `paragraphLabel` | `string` | `"Paragraph"` behavior | Label for paragraph entry in block format menu/commands. |
| `syncHeadingOptionsWithCommands` | `boolean` | `true` | Syncs heading command generation with `headingOptions`. |
| `slashCommandVisibility` | `SlashCommandVisibility` | `undefined` | Slash command filter using allowlist/denylist or enabled-ID selection array form. |
| `shortcutConfig` | `ShortcutConfig` | `undefined` | Per-instance command shortcut config (disable/remap, collision and native conflict prevention). |
| `commandPaletteShortcutOnly` | `boolean` | `false` | When `true`, command palette only shows commands that have a visible keyboard shortcut. |
| `isDraggableBoxEnabled` | `boolean` | `undefined` | Shortcut for enabling/disabling draggable block UI (maps into `featureFlags.draggableBlock`). |
| `featureFlags` | `Partial<Record<FeatureFlag, boolean>>` | all `true` | Central capability switchboard; affects extensions, toolbar, commands, shortcuts. |
| `syntaxHighlighting` | `"auto" \| "disabled"` | extension default (`"auto"`) | Code block syntax highlighting strategy. |
| `codeHighlightProvider` | `CodeHighlightProvider \| null` | `undefined` | Injected highlight provider instance. |
| `loadCodeHighlightProvider` | `() => Promise<CodeHighlightProvider \| null>` | `undefined` | Lazy async provider loader. |
| `maxAutoDetectCodeLength` | `number` | `12000` in code intelligence extension | Guard for auto language detection input size. |
| `isCopyAllowed` | `boolean` | `true` | Enables/disables code block copy button and command path. |
| `languageOptions` | `readonly string[] \| { mode?: "append"\|"replace"; values: readonly string[] }` | default language catalog | Controls visible code language options. |

### Ref Methods

```ts
type ExtensiveEditorRef = {
  injectJSONB: (content: string) => void;
  getJSONB: () => string;
};
```

## Valid Argument Sets

### `ToolbarItemType`

`"fontFamily"`, `"fontSize"`, `"lineHeight"`, `"textColor"`, `"textHighlight"`, `"bold"`, `"italic"`, `"underline"`, `"strikethrough"`, `"subscript"`, `"superscript"`, `"code"`, `"link"`, `"blockFormat"`, `"quote"`, `"alignLeft"`, `"alignCenter"`, `"alignRight"`, `"alignJustify"`, `"codeBlock"`, `"unorderedList"`, `"orderedList"`, `"checkList"`, `"indentList"`, `"outdentList"`, `"horizontalRule"`, `"table"`, `"image"`, `"emoji"`, `"embed"`, `"undo"`, `"redo"`, `"commandPalette"`, `"themeToggle"`.

### `FeatureFlag`

`"bold"`, `"italic"`, `"underline"`, `"strikethrough"`, `"fontFamily"`, `"fontSize"`, `"lineHeight"`, `"textColor"`, `"textHighlight"`, `"subscript"`, `"superscript"`, `"link"`, `"horizontalRule"`, `"table"`, `"list"`, `"history"`, `"image"`, `"blockFormat"`, `"code"`, `"codeIntelligence"`, `"codeFormat"`, `"tabIndent"`, `"enterKeyBehavior"`, `"iframeEmbed"`, `"youTubeEmbed"`, `"floatingToolbar"`, `"contextMenu"`, `"commandPalette"`, `"slashCommand"`, `"emoji"`, `"draggableBlock"`, `"customNode"`, `"themeToggle"`.

## Usage Recipes

### 1) Minimal with defaults

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor />;
}
```

### 2) Placeholder per mode + restricted modes

```tsx
<ExtensiveEditor
  initialMode="visual"
  availableModes={["visual", "jsonb"]}
  placeholder={{
    visual: "Write release notes...",
    jsonb: "Paste JSONB...",
  }}
/>
```

### 3) Feature-gated editor (product tiers)

```tsx
<ExtensiveEditor
  featureFlags={{
    image: false,
    iframeEmbed: false,
    youTubeEmbed: false,
    emoji: false,
    commandPalette: false,
  }}
  toolbarVisibility={{
    embed: false,
    image: false,
    emoji: false,
  }}
/>
```

### 4) Slash command allowlist

```tsx
<ExtensiveEditor
  slashCommandVisibility={{
    allowlist: [
      "block.paragraph",
      "block.heading1",
      "block.heading2",
      "insert.table",
    ],
    denylist: ["insert.image"],
  }}
/>
```

### 5) Code language list replacement

```tsx
<ExtensiveEditor
  languageOptions={{
    mode: "replace",
    values: ["plaintext", "typescript", "javascript", "markdown", "sql"],
  }}
  syntaxHighlighting="auto"
  maxAutoDetectCodeLength={10000}
/>
```

Optional: use highlight.js stylesheet for richer code colors

```bash
pnpm add highlight.js
```

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import "highlight.js/styles/github.css"; // any highlight.js theme

export function App() {
  return <ExtensiveEditor syntaxHighlighting="auto" />;
}
```

What happens:

- Luthor does not auto-detect code language anymore. Language comes from the selected code language option.
- Language options are normalized through Lexical/Prism aliases (`md` -> `markdown`, `js` -> `javascript` family, `ts` -> `typescript`).
- Only Prism-supported loaded languages are accepted. Unsupported values (for example `yaml` without Prism YAML grammar loaded) fall back to plain text.
- `plaintext` uses plain fallback syntax styling.
- Non-plaintext languages emit `hljs-*` token classes.
- If a highlight.js stylesheet is loaded, those `hljs-*` tokens use highlight.js colors.
- Without highlight.js stylesheet, code uses the built-in muted/plain fallback.

### 6) Per-instance shortcut remap/disable

```tsx
<ExtensiveEditor
  shortcutConfig={{
    disabledCommandIds: ["format.italic"],
    bindings: {
      "format.bold": { key: "m", ctrlKey: true },
      "palette.show": [
        { key: "k", ctrlKey: true, shiftKey: true },
      ],
    },
  }}
/>
```

### 7) Command palette shortcut-only mode

```tsx
<ExtensiveEditor commandPaletteShortcutOnly />
```

### 8) Style token overrides

```tsx
<ExtensiveEditor
  editorThemeOverrides={{
    "--luthor-bg": "#fffaf2",
    "--luthor-fg": "#431407",
    "--luthor-accent": "#c2410c",
  }}
  toolbarStyleVars={{
    "--luthor-toolbar-button-active-bg": "#ea580c",
    "--luthor-toolbar-button-active-fg": "#ffffff",
  }}
  quoteStyleVars={{
    "--luthor-quote-bg": "#fff7ed",
    "--luthor-quote-fg": "#7c2d12",
    "--luthor-quote-border": "#ea580c",
  }}
/>
```

### 9) Emoji library auto-detection (works in `apps/demo`)

Install emoji-mart data in the app:

```bash
pnpm add -F demo @emoji-mart/data
```

Then use `ExtensiveEditor` normally:

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor />;
}
```

What happens:

- `:shortcode` suggestions and resolution use the detected emoji-mart dataset.
- Emoji toolbar dropdown uses the detected emoji-mart catalog.
- If the library is not installed/available, it automatically falls back to the built-in emoji list.

## Notes and Nuances

- `featureFlags` are authoritative. If a feature is disabled, related toolbar items and commands are removed/no-op even if you attempt to show them.
- `slashCommandVisibility` keeps original command ordering; it only filters visibility.
- `shortcutConfig.disabledCommandIds` removes commands from keyboard handling and command UIs for that editor instance.
- `shortcutConfig` drops duplicate bindings by default and blocks native editable conflicts by default.
- `commandPaletteShortcutOnly` is optional; by default command palette can include command items without shortcuts.
- `languageOptions` normalizes aliases (for example `js` becomes `javascript`) and rejects duplicates after normalization.
- Emoji suggestions/tooling auto-detect external emoji-mart data when available, and otherwise use the built-in default emoji catalog.
- `defaultSettings` is style-only; behavior is controlled by explicit props (for example `featureFlags`, `availableModes`).
- `isToolbarEnabled={false}` hides toolbar UI, but editor shortcuts/features still work unless disabled via `featureFlags`.

## Which Package Should I Use?

- Use `@lyfie/luthor` for fast onboarding and polished defaults.
- Use `@lyfie/luthor-headless` for full extension/UI control.

## Documentation

- Monorepo docs index: [../../documentation/index.md](../../documentation/index.md)
- Headless package README: [../headless/README.md](../headless/README.md)
- User docs: [../../documentation/user/luthor/getting-started.md](../../documentation/user/luthor/getting-started.md)
- Developer docs: [../../documentation/developer/luthor/architecture.md](../../documentation/developer/luthor/architecture.md)

## Workspace Development

```bash
pnpm --filter @lyfie/luthor dev
pnpm --filter @lyfie/luthor build
pnpm --filter @lyfie/luthor lint
```
