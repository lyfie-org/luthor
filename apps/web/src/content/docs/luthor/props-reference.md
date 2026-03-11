---
title: Props Reference
description: Contributor-level prop reference for ExtensiveEditor and all preset wrappers in @lyfie/luthor.
---

# Props Reference

This page explains how preset props are layered. Most wrappers inherit `ExtensiveEditorProps` and then constrain modes or features.

## 1) `ExtensiveEditorProps` (base preset)

### Content and mode

- `defaultContent?: string`
- `showDefaultContent?: boolean` (default `true`)
- `placeholder?: string | { visual?: string; json?: string; markdown?: string; html?: string }`
- `initialMode?: 'visual-only' | 'visual-editor' | 'visual' | 'json' | 'markdown' | 'html'`
- `defaultEditorView?: same as initialMode`
- `availableModes?: readonly ExtensiveEditorMode[]`
- `isEditorViewTabsVisible?: boolean`
- `isEditorViewsTabVisible?: boolean` (legacy alias)

### Toolbar and command UI

- `isToolbarEnabled?: boolean` (default `true`)
- `toolbarPosition?: 'top' | 'bottom'`
- `toolbarAlignment?: 'left' | 'center' | 'right'`
- `toolbarLayout?: ToolbarLayout`
- `toolbarVisibility?: ToolbarVisibility`
- `toolbarClassName?: string`
- `toolbarStyleVars?: ToolbarStyleVars`
- `isToolbarPinned?: boolean`
- `slashCommandVisibility?: SlashCommandVisibility`
- `commandPaletteShortcutOnly?: boolean`
- `shortcutConfig?: ShortcutConfig`

### Features and editing behavior

- `featureFlags?: FeatureFlagOverrides`
- `editOnClick?: boolean` (visual-only to visual-editor promotion on click)
- `isDraggableBoxEnabled?: boolean` (mapped into draggable feature flag)
- `syncHeadingOptionsWithCommands?: boolean`
- `headingOptions?: readonly ('h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')[]`
- `paragraphLabel?: string`
- `isCopyAllowed?: boolean`

### Theme and style

- `initialTheme?: 'light' | 'dark'`
- `onThemeChange?: (theme: 'light' | 'dark') => void`
- `theme?: Partial<LuthorTheme>`
- `editorThemeOverrides?: LuthorEditorThemeOverrides`
- `quoteClassName?: string`
- `quoteStyleVars?: QuoteStyleVars`
- `defaultSettings?: DefaultSettings`
- `className?: string`
- `variantClassName?: string`

### Typography and code options

- `fontFamilyOptions?: readonly FontFamilyOption[]`
- `fontSizeOptions?: readonly FontSizeOption[]`
- `lineHeightOptions?: readonly LineHeightOption[]`
- `minimumDefaultLineHeight?: string | number`
- `scaleByRatio?: boolean`
- `syntaxHighlighting?: 'auto' | 'disabled'`
- `codeHighlightProvider?: CodeHighlightProvider | null`
- `loadCodeHighlightProvider?: () => Promise<CodeHighlightProvider | null>`
- `maxAutoDetectCodeLength?: number`
- `languageOptions?: readonly string[] | CodeLanguageOptionsConfig`
- `maxListIndentation?: number` (sub-indent depth)

### Lifecycle and ref

- `onReady?: (methods: ExtensiveEditorRef) => void`
- Ref methods: `injectJSON(content: string): void` and `getJSON(): string`

## 2) Preset-specific additions

### `ComposeEditorProps`

Inherits `ExtensiveEditorProps` (except direct `featureFlags`), then adds:

- `featureFlags?: FeatureFlagOverrides`
- `compactToolbar?: boolean`

Default modes are constrained to `['visual', 'json']` and media or metadata-heavy features are disabled by default.

### `SimpleEditorProps`

Purpose-built message input wrapper.

- `formattingOptions?: { bold?: boolean; italic?: boolean; strikethrough?: boolean }`
- `onSend?: (payload: SimpleEditorSendPayload) => void`
- `outputFormat?: 'md' | 'json'`
- `clearOnSend?: boolean`
- `submitOnEnter?: boolean`
- `allowShiftEnter?: boolean`
- `minHeight | maxHeight | minWidth | maxWidth`
- `toolbarButtons?: readonly SimpleToolbarButton[]`
- `showBottomToolbar?: boolean`
- `showSendButton?: boolean`
- `sendButtonPlacement?: 'inside' | 'right'`

### `LegacyRichEditorProps`

Inherits `ExtensiveEditorProps` but constrains source and mode behavior:

- `sourceFormat?: 'markdown' | 'html' | 'both'`
- `initialMode?: LegacyRichEditorMode`
- `defaultEditorView?: LegacyRichEditorMode`
- `featureFlags?: FeatureFlagOverrides`

### `MDEditorProps`

`LegacyRichEditor` wrapper with:

- `sourceFormat` fixed to `'markdown'`
- modes limited to `'visual' | 'json' | 'markdown'`

### `HTMLEditorProps`

`LegacyRichEditor` wrapper with:

- `sourceFormat` fixed to `'html'`
- modes limited to `'visual' | 'json' | 'html'`

### `SlashEditorProps`

Inherits most of `ExtensiveEditorProps`, adds:

- `slashVisibility?: SlashCommandVisibility`
- `isDraggableEnabled?: boolean`
- `featureFlags?: FeatureFlagOverrides`
- `isToolbarEnabled?: boolean` (default `false`)

Slash command support is enforced on.

### `HeadlessEditorPresetProps`

Inherits `ExtensiveEditorProps` but constrains:

- `initialMode?: 'visual' | 'json' | 'markdown' | 'html'`
- `defaultEditorView?: same`
- `featureFlags?: FeatureFlagOverrides`

Uses a text-pill toolbar and metadata-light defaults.

## 3) Practical patterns

Visual + markdown workflow:

```tsx
<MDEditor initialMode="visual" defaultEditorView="markdown" />
```

Disable heavy features without changing preset:

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

Sync host syntax theme with editor theme:

```tsx
<ExtensiveEditor
  initialTheme="light"
  onThemeChange={(theme) => {
    console.log(theme);
  }}
/>
```

## 4) Related pages

- [/docs/luthor/architecture/](/docs/luthor/architecture/)
- [/docs/luthor/feature-flags/](/docs/luthor/feature-flags/)
- [/docs/luthor/presets/](/docs/luthor/presets/)
