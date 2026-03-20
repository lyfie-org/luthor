---
title: Props Reference
description: Complete prop and ref reference for ExtensiveEditor and all @lyfie/luthor preset wrappers.
---

# Props Reference

This page is the full prop contract for `@lyfie/luthor` presets.

- Base preset: `ExtensiveEditor`
- Wrapper presets: `ComposeEditor`, `SimpleEditor`, `LegacyRichEditor`, `MarkDownEditor`, `HTMLEditor`, `SlashEditor`, `HeadlessEditorPreset`

## 1) `ExtensiveEditorProps` (base contract)

### Content and mode

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `defaultContent` | `string` | `undefined` | Injected on ready when present. |
| `showDefaultContent` | `boolean` | `true` | When true and `defaultContent` is empty, ships with welcome JSON content. |
| `placeholder` | `string \| { visual?: string; json?: string; markdown?: string; html?: string }` | `"Write anything..."` | Source modes have dedicated default placeholders. |
| `initialMode` | `'visual-only' \| 'visual-editor' \| 'visual' \| 'json' \| 'markdown' \| 'html'` | `'visual-editor'` | `visual` is accepted and normalized to `visual-editor`. |
| `defaultEditorView` | same as `initialMode` | `undefined` | If set, overrides `initialMode` for first view. |
| `availableModes` | `readonly ExtensiveEditorMode[]` | `['visual-editor', 'visual-only', 'json', 'markdown', 'html']` | Invalid initial/default mode falls back to first available mode. |
| `isEditorViewTabsVisible` | `boolean` | `true` | Preferred prop name for mode tabs visibility. |
| `isEditorViewsTabVisible` | `boolean` | `undefined` | Legacy alias; used when preferred prop is not provided. |

### Lifecycle and ref

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `onReady` | `(methods: ExtensiveEditorRef) => void` | `undefined` | Called when editor methods are ready. |

`ExtensiveEditorRef` methods:

- `injectJSON(content: string): void`
- `getJSON(): string`
- `getMarkdown(): string`
- `getHTML(): string`

### Toolbar, layout, and visibility

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `isToolbarEnabled` | `boolean` | `true` | Hides toolbar UI only; command wiring still exists. |
| `isToolbarPinned` | `boolean` | `false` | Sticky pin behavior for top toolbar region. |
| `toolbarPosition` | `'top' \| 'bottom'` | `'top'` | Top is most common for docs/editing UX. |
| `toolbarAlignment` | `'left' \| 'center' \| 'right'` | `'left'` | Alignment inside toolbar region. |
| `toolbarLayout` | `ToolbarLayout` | `undefined` | Use default/traditional/custom section layouts. |
| `toolbarVisibility` | `ToolbarVisibility` | `undefined` | Per-toolbar-item visibility overrides. |
| `toolbarClassName` | `string` | `undefined` | Class name for toolbar root. |
| `toolbarStyleVars` | `ToolbarStyleVars` | `undefined` | CSS custom properties for toolbar theme tokens. |
| `className` | `string` | `undefined` | Class on preset wrapper root. |
| `variantClassName` | `string` | `undefined` | Class on preset variant shell. |

### Feature gating and behavior

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `featureFlags` | `FeatureFlagOverrides` | `undefined` | Partial override map for all extensive feature flags. |
| `isDraggableBoxEnabled` | `boolean` | `undefined` | Convenience alias for draggable behavior; merges into `featureFlags.draggableBlock`. |
| `editOnClick` | `boolean` | `true` | In `visual-only` mode, click promotes to editable mode and places caret near click. |
| `syncHeadingOptionsWithCommands` | `boolean` | `true` | Keeps command palette/slash heading options synced with heading controls. |
| `headingOptions` | `readonly ('h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6')[]` | all levels | Filters available heading levels. |
| `paragraphLabel` | `string` | `'Paragraph'` | Label used in command-generated block entry. |
| `isCopyAllowed` | `boolean` | `true` | Used by code intelligence copy behavior. |

### Slash, palette, and shortcuts

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `slashCommandVisibility` | `SlashCommandVisibility` | `undefined` | Supports allow/deny filters or explicit selection arrays. |
| `shortcutConfig` | `ShortcutConfig` | `undefined` | Override bindings, disable command IDs, collision/native conflict behavior. |
| `commandPaletteShortcutOnly` | `boolean` | `false` | When true, palette shows only commands that currently have shortcuts. |

### Theme and style system

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `initialTheme` | `'light' \| 'dark'` | `'light'` | Initial theme state for preset UI. |
| `onThemeChange` | `(theme: 'light' \| 'dark') => void` | `undefined` | Called whenever theme changes. |
| `theme` | `Partial<LuthorTheme>` | `undefined` | Deep merge into default headless theme. |
| `editorThemeOverrides` | `LuthorEditorThemeOverrides` | `undefined` | Token-level CSS var bridge for editor theme. |
| `defaultSettings` | `DefaultSettings` | `undefined` | High-level style defaults (font, link, list, quote, table, hr, placeholder, codeblock, toolbar). |
| `quoteClassName` | `string` | `undefined` | Extra class merged into quote node styles. |
| `quoteStyleVars` | `QuoteStyleVars` | `undefined` | Quote visual CSS vars. |

### Typography and code configuration

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `fontFamilyOptions` | `readonly FontFamilyOption[]` | built-in list | Includes `default`, `inter`, `merriweather`, `jetbrains-mono` by default. |
| `fontSizeOptions` | `readonly FontSizeOption[]` | built-in list | Includes common pixel sizes + default option. |
| `lineHeightOptions` | `readonly LineHeightOption[]` | built-in list | Includes default and common ratios. |
| `minimumDefaultLineHeight` | `string \| number` | `1.5` | Validated and normalized; invalid values fall back to `1.5`. |
| `scaleByRatio` | `boolean` | `false` | Used by image resize behavior. |
| `syntaxHighlighting` | `'auto' \| 'disabled'` | extension default | Controls code syntax highlighting behavior. |
| `codeHighlightProvider` | `CodeHighlightProvider \| null` | `undefined` | Inject a concrete provider implementation. |
| `loadCodeHighlightProvider` | `() => Promise<CodeHighlightProvider \| null>` | `undefined` | Lazy loader for provider implementation. |
| `showLineNumbers` | `boolean` | `true` | Enables line numbers for visual code blocks and source tabs (`json`/`markdown`/`html`). |
| `maxAutoDetectCodeLength` | `number` | `undefined` | Max code length for language autodetect. |
| `languageOptions` | `readonly string[] \| CodeLanguageOptionsConfig` | `undefined` | Language option list or config object (`mode`, `values`); dropdown labels use full names and only include runtime-loaded grammars. `@lyfie/luthor` preloads common Prism grammars (`bash`, `json`, `yaml`, `go`, `csharp`, `docker`, `graphql`, `php`, `ruby`, `kotlin`, `toml`, `ini`, `json5`). |
| `maxListIndentation` | `number` | `8` | Maximum sub-indent levels below root list level. |

Line-number behavior notes:

- Wrapped markdown/html source rows are continuation rows and remain unnumbered to preserve logical line alignment.
- Line numbers are reference-only and are excluded from copy behavior in both code blocks and source tabs.

## 2) Preset-specific prop layers

### `ComposeEditorProps`

`ComposeEditorProps = Omit<ExtensiveEditorProps, "featureFlags"> & { featureFlags?: FeatureFlagOverrides; compactToolbar?: boolean }`

- Adds:
  - `featureFlags?`
  - `compactToolbar?: boolean` (default `false`)
- Forces mode profile:
  - `availableModes = ["visual-only", "visual", "json"]`

### `SimpleEditorProps`

`SimpleEditor` is a purpose-built message input wrapper and does not expose the full extensive surface directly.

| Prop | Type | Default |
| --- | --- | --- |
| `className` / `variantClassName` | `string` | `undefined` |
| `initialTheme` | `'light' \| 'dark'` | inherited |
| `onThemeChange` | callback | `undefined` |
| `theme` | `Partial<LuthorTheme>` | `undefined` |
| `defaultContent` | `string` | `undefined` |
| `showDefaultContent` | `boolean` | `false` |
| `placeholder` | `ExtensiveEditorProps["placeholder"]` | `undefined` |
| `formattingOptions` | `{ bold?: boolean; italic?: boolean; strikethrough?: boolean }` | all enabled |
| `onSend` | `(payload: SimpleEditorSendPayload) => void` | `undefined` |
| `outputFormat` | `'md' \| 'json'` | `'md'` |
| `clearOnSend` | `boolean` | `true` |
| `allowEmptySend` | `boolean` | `false` |
| `submitOnEnter` | `boolean` | `false` |
| `allowShiftEnter` | `boolean` | `true` |
| `minHeight` | `number \| string` | `56` |
| `maxHeight` | `number \| string` | `220` |
| `minWidth` | `number \| string` | `240` |
| `maxWidth` | `number \| string` | `'100%'` |
| `showBottomToolbar` | `boolean` | `true` |
| `toolbarButtons` | `readonly SimpleToolbarButton[]` | `[]` |
| `toolbarClassName` | `string` | `undefined` |
| `toolbarStyle` | `CSSProperties` | `undefined` |
| `showSendButton` | `boolean` | `true` |
| `sendButtonPlacement` | `'inside' \| 'right'` | `'inside'` |
| `sendButtonContent` | `ReactNode` | `'Send'` |
| `sendButtonAriaLabel` | `string` | `'Send message'` |
| `sendButtonClassName` | `string` | `undefined` |
| `scrollAreaClassName` | `string` | `undefined` |

`SimpleEditorSendPayload`:

- `format: 'md' | 'json'`
- `text: string` (selected output format)
- `markdown: string`
- `json: string`

### `LegacyRichEditorProps`

`LegacyRichEditorProps = Omit<ExtensiveEditorProps, "featureFlags" | "availableModes" | "initialMode" | "defaultEditorView"> & { sourceFormat?: 'markdown' | 'html' | 'both'; initialMode?: LegacyRichEditorMode; defaultEditorView?: LegacyRichEditorMode; featureFlags?: FeatureFlagOverrides }`

- `sourceFormat` default: `'both'`
- Mode sets by source format:
  - `'both'` -> `['visual-only', 'visual', 'markdown', 'html']`
  - `'markdown'` -> `['visual-only', 'visual', 'json', 'markdown']`
  - `'html'` -> `['visual-only', 'visual', 'json', 'html']`

### `MarkDownEditorProps`

- Inherits `LegacyRichEditorProps`
- Fixes source format to markdown
- Allowed modes: `'visual-only' | 'visual' | 'json' | 'markdown'`

### `HTMLEditorProps`

- Inherits `LegacyRichEditorProps`
- Fixes source format to html
- Allowed modes: `'visual-only' | 'visual' | 'json' | 'html'`

### `SlashEditorProps`

`SlashEditorProps = Omit<ExtensiveEditorProps, "featureFlags" | "isToolbarEnabled"> & { slashVisibility?: SlashCommandVisibility; isDraggableEnabled?: boolean; featureFlags?: FeatureFlagOverrides; isToolbarEnabled?: boolean }`

- `isToolbarEnabled` default: `false`
- `isDraggableEnabled` default: `true`
- Enforced behavior:
  - `slashCommand: true`
  - `commandPalette: false`

### `HeadlessEditorPresetProps`

`HeadlessEditorPresetProps = Omit<ExtensiveEditorProps, "featureFlags" | "availableModes" | "initialMode" | "defaultEditorView"> & { initialMode?: 'visual-only' | 'visual' | 'json' | 'markdown' | 'html'; defaultEditorView?: same; featureFlags?: FeatureFlagOverrides }`

- Allowed modes fixed to: `['visual-only', 'visual', 'json', 'markdown', 'html']`
- Uses lightweight feature policy defaults and enforcement.

## 3) Practical usage patterns

### Save all output formats from ref

```tsx
import { useRef } from 'react';
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor';

export function SaveExample() {
  const ref = useRef<ExtensiveEditorRef>(null);

  return (
    <>
      <button
        onClick={() => {
          const methods = ref.current;
          if (!methods) return;
          console.log({
            json: methods.getJSON(),
            markdown: methods.getMarkdown(),
            html: methods.getHTML(),
          });
        }}
      >
        Save
      </button>
      <ExtensiveEditor ref={ref} />
    </>
  );
}
```

### Disable heavy features without changing preset

```tsx
<ExtensiveEditor
  featureFlags={{
    image: false,
    table: false,
    iframeEmbed: false,
    youTubeEmbed: false,
    customNode: false,
  }}
/>
```

### Markdown-first editing profile

```tsx
<MarkDownEditor initialMode="visual" defaultEditorView="markdown" />
```

## 4) Related pages

- [Architecture](/docs/luthor/architecture/)
- [Feature Flags](/docs/luthor/feature-flags/)
- [Presets](/docs/luthor/presets/)
