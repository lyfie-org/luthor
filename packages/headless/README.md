# @lyfie/luthor-headless

Type-safe, headless rich text editor system for React, built on Lexical.

## Installation

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional syntax highlighting provider:

```bash
pnpm add highlight.js
```

## Quick Start

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();

  return (
    <div>
      <button onClick={() => commands.toggleBold()} aria-pressed={activeStates.bold}>
        Bold
      </button>
      <button onClick={() => commands.toggleItalic()} aria-pressed={activeStates.italic}>
        Italic
      </button>
    </div>
  );
}

export function Editor() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## Core API

### `createEditorSystem<Exts>()`

Returns:

- `Provider(props)`
- `useEditor()`

`Provider` props:

- `extensions: Exts` (required)
- `children: ReactNode` (required)
- `config?: EditorConfig`

`EditorConfig`:

- `theme?: EditorThemeClasses`
- any additional keys are allowed and can be consumed by extensions/components

### `useEditor()` context

Returns strongly typed surface based on `extensions`:

- `commands`
- `activeStates`
- `stateQueries`
- `hasExtension(name)`
- `export.toJSON()`
- `import.fromJSON(json)`
- `lexical` / `editor`
- `plugins`
- listener helpers (`registerUpdate`, `registerPaste`)

## RichText Component API

`RichText` and `RichTextExtension` use the same prop shape:

- `contentEditable?: ReactElement`
- `placeholder?: ReactElement | string`
- `className?: string`
- `classNames?: { container?: string; contentEditable?: string; placeholder?: string }`
- `styles?: { container?: CSSProperties; contentEditable?: CSSProperties; placeholder?: CSSProperties }`
- `errorBoundary?: ComponentType<{ children: JSX.Element; onError: (error: Error) => void }>`

## Theme Utilities

- `defaultLuthorTheme`
- `mergeThemes(baseTheme, overrideTheme)`
- `isLuthorTheme(value)`
- `LUTHOR_EDITOR_THEME_TOKENS`
- `createEditorThemeStyleVars(overrides)`

`LuthorEditorThemeOverrides` is a token map with keys from `LUTHOR_EDITOR_THEME_TOKENS` and string values.

## Base Extension Config

All extension configs support `BaseExtensionConfig`:

- `showInToolbar?: boolean`
- `category?: ExtensionCategory[]`
- `position?: "before" | "after"`
- `initPriority?: number`

## Built-in Extensions

### Text Formatting

- `boldExtension`
- `italicExtension`
- `underlineExtension`
- `strikethroughExtension`
- `subscriptExtension`
- `superscriptExtension`
- `codeFormatExtension` (inline code mark)

These are toggle-style text-format extensions and do not require custom config.

### Link Extension (`LinkExtension`, `linkExtension`)

`LinkConfig`:

- `autoLinkText?: boolean`
- `autoLinkUrls?: boolean`
- `linkSelectedTextOnPaste?: boolean`
- `validateUrl?: (url: string) => boolean`
- `clickableLinks?: boolean`
- `openLinksInNewTab?: boolean`

Commands:

- `insertLink(url?, text?)`
- `updateLink(url, rel?, target?)`
- `removeLink()`
- `getCurrentLink()`
- `getLinkByKey(linkNodeKey)`
- `updateLinkByKey(linkNodeKey, url, rel?, target?)`
- `removeLinkByKey(linkNodeKey)`

Note: set `autoLinkUrls` explicitly in your config for unambiguous paste-link behavior.

### Typography Selectors

#### `FontFamilyExtension`

`FontFamilyOption`:

- `value: string`
- `label: string`
- `fontFamily: string`
- `cssImportUrl?: string`

`FontFamilyConfig`:

- `options: readonly FontFamilyOption[]`
- `cssLoadStrategy: "none" | "preload-all" | "on-demand"`

Nuances:

- Invalid/duplicate option values are sanitized out.
- `default` option is auto-inserted when omitted.

#### `FontSizeExtension`

`FontSizeOption`:

- `value: string`
- `label: string`
- `fontSize: string`

`FontSizeConfig`:

- `options: readonly FontSizeOption[]`

Nuances:

- Invalid/duplicate option values are sanitized out.
- `default` option is auto-inserted when omitted.

#### `LineHeightExtension`

`LineHeightOption`:

- `value: string`
- `label: string`
- `lineHeight: string`

`LineHeightConfig`:

- `options: readonly LineHeightOption[]`
- `defaultLineHeight?: string` (default `"1.5"`)

Nuances:

- `value: "default"` maps to `defaultLineHeight` (or `"1.5"` when not configured).
- Non-default entries should use numeric ratios `>= 1.0` (`"1"`, `"1.5"`, `"2"`).
- Line height is applied at block level (TinyMCE-style): selecting text inside a block updates that whole block.

#### `TextColorExtension`

`TextColorOption`:

- `value: string`
- `label: string`
- `color: string`

`TextColorConfig`:

- `options: readonly TextColorOption[]`

Nuances:

- `setTextColor` accepts configured option values and valid CSS colors.

#### `TextHighlightExtension`

`TextHighlightOption`:

- `value: string`
- `label: string`
- `backgroundColor: string`

`TextHighlightConfig`:

- `options: readonly TextHighlightOption[]`

Nuances:

- `setTextHighlight` accepts configured option values and valid CSS colors.
- Highlight styling also patches padding/box-decoration style helpers for clean rendering.

### Block/Structure Extensions

#### `blockFormatExtension`

Commands include paragraph/heading/quote toggles and alignment helpers. No custom config required.

#### `listExtension`

Commands include unordered/ordered/check list toggles and indentation commands. No custom config required.

#### `horizontalRuleExtension`

Commands include horizontal rule insertion. No custom config required.

### Code Extensions

#### `CodeExtension`

`CodeExtensionConfig`:

- `syntaxHighlighting?: "auto" | "disabled"`
- `tokenizer?: CodeTokenizer | null`
- `provider?: CodeHighlightProvider | null`
- `loadProvider?: () => Promise<CodeHighlightProvider | null>`

Usage (manual language selection + plaintext fallback):

```tsx
import {
  codeExtension,
  codeIntelligenceExtension,
} from "@lyfie/luthor-headless";

const extensions = [
  codeExtension.configure({
    syntaxHighlighting: "auto", // default
  }),
  codeIntelligenceExtension,
] as const;
```

- `CodeIntelligenceExtension` no longer auto-detects code languages.
- Selecting `plaintext` keeps code tokens in the plaintext fallback theme (`plain`).
- Selecting any non-plaintext language switches token classes to the `hljs-*` namespace.
- Language values are alias-normalized (`md` -> `markdown`, `ts` -> `typescript`, `js` -> `javascript` family).
- Only Prism-supported loaded languages are accepted. Unsupported values are treated as plaintext.
- If your app loads a highlight.js stylesheet, those `hljs-*` token colors are applied automatically.
- Without a highlight.js stylesheet, code remains muted/plain fallback.

`CodeHighlightProvider` shape:

- `highlightAuto?(code, languageSubset?)`
- `tokenizer?: CodeTokenizer | null`
- `getTokenizer?: () => CodeTokenizer | null | Promise<CodeTokenizer | null>`

#### `CodeIntelligenceExtension`

`CodeLanguageOptionsConfig`:

- `mode?: "append" | "replace"`
- `values: readonly string[]`

`CodeIntelligenceConfig`:

- `provider?: CodeHighlightProvider | null`
- `loadProvider?: () => Promise<CodeHighlightProvider | null>`
- `maxAutoDetectLength?: number` (default `12000`)
- `isCopyAllowed?: boolean` (default `true`)
- `languageOptions?: readonly string[] | CodeLanguageOptionsConfig`

Commands:

- `setCodeLanguage(language)`
- `autoDetectCodeLanguage()`
- `getCurrentCodeLanguage()`
- `getCodeLanguageOptions()`
- `copySelectedCodeBlock()`

Nuances:

- Array form for `languageOptions` is equivalent to `{ mode: "append", values }`.
- Aliases are normalized.
- Duplicate normalized languages throw.

### History and Input Behavior

- `historyExtension`: undo/redo commands and canUndo/canRedo state.
- `tabIndentExtension`: tab/shift-tab indent behavior.
- `enterKeyBehaviorExtension`: enter behavior normalization (quotes/code/table transitions). No extra config.

### Table Extension (`TableExtension`, `tableExtension`)

`TableConfig`:

- `rows?: number`
- `columns?: number`
- `includeHeaders?: boolean`
- `enableContextMenu?: boolean`
- `contextMenuItems?: ContextMenuItem[] | ((commands: TableCommands) => ContextMenuItem[])`
- `contextMenuRenderer?: ContextMenuRenderer`
- `contextMenuExtension?: typeof contextMenuExtension`
- `tableBubbleRenderer?: (props: TableBubbleRenderProps) => ReactNode`

`TableBubbleRenderProps`:

- `headersEnabled: boolean`
- `setHeadersEnabled(enabled)`
- `actions`: row/column insert/delete + delete table actions

Defaults:

- `rows: 3`
- `columns: 3`
- `includeHeaders: false`
- `enableContextMenu: true`

### Media Extensions

#### Image (`ImageExtension`, `imageExtension`)

`ImageExtensionConfig`:

- `uploadHandler?: (file: File) => Promise<string>`
- `defaultAlignment?: "left" | "right" | "center" | "none"`
- `classNames?: Partial<Record<Alignment | "wrapper" | "caption", string>>`
- `styles?: Partial<Record<Alignment | "wrapper" | "caption", CSSProperties>>`
- `customRenderer?: ComponentType<ImageComponentProps>`
- `resizable?: boolean` (default `true`)
- `scaleByRatio?: boolean` (default `false`)
- `pasteListener?: { insert: boolean; replace: boolean }` (default both `true`)
- `debug?: boolean` (default `false`)
- `forceUpload?: boolean` (default `false`)

#### Iframe (`IframeEmbedExtension`, `iframeEmbedExtension`)

`IframeEmbedConfig`:

- `defaultWidth?: number` (default `640`)
- `defaultHeight?: number` (default `360`)
- `defaultAlignment?: "left" | "center" | "right"` (default `"center"`)

#### YouTube (`YouTubeEmbedExtension`, `youTubeEmbedExtension`)

`YouTubeEmbedConfig`:

- `defaultWidth?: number` (default `640`)
- `defaultHeight?: number` (default `480`)
- `defaultAlignment?: "left" | "center" | "right"` (default `"center"`)
- `allowFullscreen?: boolean` (default `true`)
- `autoplay?: boolean` (default `false`)
- `controls?: boolean` (default `true`)
- `nocookie?: boolean` (default `true`)
- `rel?: number` (default `1`)

### Command UI Extensions

#### Slash Command (`SlashCommandExtension`, `slashCommandExtension`)

`SlashCommandItem`:

- `id`, `label`, `action`
- optional: `description`, `keywords`, `category`, `icon`, `shortcut`

`SlashCommandConfig`:

- `trigger?: string` (default `"/"`)
- `offset?: { x: number; y: number }` (default `{ x: 0, y: 8 }`)
- `items?: readonly SlashCommandItem[]`

Commands:

- `registerSlashCommand(item)`
- `unregisterSlashCommand(id)`
- `setSlashCommands(items)`
- `closeSlashMenu()`
- `executeSlashCommand(id)`

#### Command Palette (`CommandPaletteExtension`, `commandPaletteExtension`)

`CommandPaletteItem`:

- `id`, `label`, `action`
- optional: `description`, `keywords`, `category`, `icon`, `shortcut`

Commands:

- `showCommandPalette()`
- `hideCommandPalette()`
- `registerCommand(item)`
- `unregisterCommand(id)`

#### Emoji (`EmojiExtension`, `emojiExtension`)

`EmojiCatalogItem`:

- `emoji`, `label`, `shortcodes`
- optional `keywords`

`EmojiConfig`:

- `trigger?: string` (default `":"`)
- `maxSuggestions?: number` (default `8`)
- `maxQueryLength?: number` (default `32`)
- `autoReplaceSymbols?: boolean` (default `true`)
- `symbolReplacements?: Record<string, string>`
- `catalog?: EmojiCatalogItem[]`
- `catalogAdapter?: { search(query, options?), resolveShortcode(shortcode), getAll() }`
- `autoDetectExternalCatalog?: boolean` (default `true`, auto-detects emoji-mart data if available)
- `offset?: { x: number; y: number }` (default `{ x: 0, y: 8 }`)

Commands:

- `insertEmoji(emoji)`
- `executeEmojiSuggestion(emoji)`
- `closeEmojiSuggestions()`
- `getEmojiSuggestions(query?)`
- `getEmojiCatalog()`
- `resolveEmojiShortcode(shortcode)`
- `setEmojiCatalog(catalog)`
- `setEmojiCatalogAdapter(adapter)`
- `getEmojiCatalogAdapter()`

Behavior:

- If no custom catalog/adapter is provided, emoji will auto-detect emoji-mart data when available.
- If nothing is detected, it falls back to the built-in lightweight catalog.

Usage (including `apps/demo`):

```bash
pnpm add -F demo @emoji-mart/data
```

- No editor config changes are required.
- After install, typing `:shortcode` and opening the emoji toolbar picker will use the detected emoji-mart catalog.
- If `@emoji-mart/data` is not installed (or not available globally), behavior stays on the built-in fallback catalog.

### Context/Overlay Extensions

#### Context Menu (`ContextMenuExtension`, `contextMenuExtension`)

`ContextMenuConfig`:

- `defaultRenderer?: ContextMenuRenderer`
- `preventDefault?: boolean`
- `theme?: { container?: string; item?: string; itemDisabled?: string }`
- `styles?: { container?: CSSProperties; item?: CSSProperties; itemDisabled?: CSSProperties }`

Commands:

- `registerProvider(provider)`
- `unregisterProvider(id)`
- `showContextMenu({ items, position, renderer? })`
- `hideContextMenu()`

`ContextMenuProvider`:

- `id`
- `priority?`
- `canHandle(context)`
- `getItems(context)`
- `renderer?`

#### Floating Toolbar (`FloatingToolbarExtension`, `floatingToolbarExtension`)

`FloatingConfig<TCommands, TStates>`:

- `render(props)`
- `getCommands?(): TCommands`
- `getActiveStates?(): TStates`
- `anchorElem?: HTMLElement`
- `debounceMs?: number` (default `100`)
- `offset?: { x: number; y: number }` (default `{ x: 0, y: 8 }`)
- `positionStrategy?: "above" | "below" | "auto"` (default `"below"`)
- `theme?: { container?: string; button?: string; buttonActive?: string }`
- `toolbarDimensions?: { width: number; height: number }`

#### Draggable Blocks (`DraggableBlockExtension`, `draggableBlockExtension`)

`DraggableConfig`:

- `anchorElem?: HTMLElement`
- `showAddButton?: boolean`
- `buttonStackPosition?: "left" | "right"`
- `enableTextSelectionDrag?: boolean`
- `offsetLeft?: number`
- `offsetRight?: number`
- `theme?: { handle?, handleActive?, blockDragging?, dropIndicator?, addButton?, buttonStack? }`
- `styles?: { handle?, handleActive?, blockDragging?, dropIndicator?, addButton?, buttonStack? }`
- `handleRenderer?(props)`
- `buttonsRenderer?(props)`
- `dropIndicatorRenderer?(props)`

Default behavior includes draggable handle, add button, and left-side controls.

### Custom Nodes

`createCustomNodeExtension(config)` lets you define a full custom node extension.

`CustomNodeConfig` includes:

- `nodeType: string`
- `isContainer?: boolean`
- `defaultPayload?: Record<string, any>`
- `initialChildren?: () => SerializedLexicalNode[]`
- `render?` or `jsx?`
- DOM import/export hooks (`createDOM`, `updateDOM`, `importDOM`, `exportDOM`)
- `commands?(editor)`
- `stateQueries?(editor)`

Returns:

- `extension`
- `$createCustomNode(payload?)`
- `jsxToDOM(jsxElement)`

## Complete Extension Example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  historyExtension,
  boldExtension,
  italicExtension,
  linkExtension,
  listExtension,
  blockFormatExtension,
  tableExtension,
  imageExtension,
  slashCommandExtension,
  commandPaletteExtension,
  codeExtension,
  codeIntelligenceExtension,
} from "@lyfie/luthor-headless";

const extensions = [
  richTextExtension,
  historyExtension,
  boldExtension,
  italicExtension,
  linkExtension.configure({
    autoLinkText: true,
    autoLinkUrls: true,
    linkSelectedTextOnPaste: true,
  }),
  listExtension,
  blockFormatExtension,
  tableExtension.configure({
    rows: 3,
    columns: 4,
    includeHeaders: true,
  }),
  imageExtension.configure({
    resizable: true,
    scaleByRatio: true,
  }),
  codeExtension.configure({
    syntaxHighlighting: "auto",
  }),
  codeIntelligenceExtension.configure({
    maxAutoDetectLength: 12000,
    isCopyAllowed: true,
    languageOptions: {
      mode: "append",
      values: ["sql", "yaml"],
    },
  }),
  slashCommandExtension,
  commandPaletteExtension,
] as const;

const { Provider } = createEditorSystem<typeof extensions>();

export function Editor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## Documentation

- Monorepo docs index: [../../documentation/index.md](../../documentation/index.md)
- User docs: [../../documentation/user/headless/getting-started.md](../../documentation/user/headless/getting-started.md)
- Developer docs: [../../documentation/developer/headless/architecture.md](../../documentation/developer/headless/architecture.md)
- Luthor preset package README: [../luthor/README.md](../luthor/README.md)

## Workspace Development

```bash
pnpm --filter @lyfie/luthor-headless dev
pnpm --filter @lyfie/luthor-headless build
pnpm --filter @lyfie/luthor-headless lint
```
