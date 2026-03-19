---
title: Extensions and API
description: Extension catalog and API usage for createEditorSystem, RichText, and custom extension authoring in @lyfie/luthor-headless.
---

# Extensions and API

This page is the full API map for `@lyfie/luthor-headless`.

## Core entry points

- `createEditorSystem`
- `createExtension`
- `RichText` and `richTextExtension`
- `markdownToJSON`, `jsonToMarkdown`, `htmlToJSON`, `jsonToHTML`
- `appendMetadataEnvelopes`, `extractMetadataEnvelopes`, `rehydrateDocumentFromEnvelopes`
- `defaultLuthorTheme`, `mergeThemes`, `createEditorThemeStyleVars`
- `clearLexicalSelection`, `resolveLinkNodeKeyFromAnchor`

## Minimal typed setup

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from '@lyfie/luthor-headless';

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>
      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>
    </div>
  );
}

export function Editor() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write..." />
    </Provider>
  );
}
```

## `createEditorSystem` return shape

`createEditorSystem<typeof extensions>()` returns:

- `Provider`
  - Props: `extensions`, optional `config`, `children`
- `useEditor`
  - Returns editor context with:
    - `commands`
    - `activeStates`
    - `stateQueries`
    - `listeners.registerUpdate(...)`
    - `listeners.registerPaste(...)`
    - `export.toJSON()`
    - `import.fromJSON(...)`
    - `editor` / `lexical`
    - `extensions`, `hasExtension(name)`, `plugins`

## `RichText` props

`RichText` and `RichTextConfig` share these props:

- `placeholder?: ReactElement | string`
- `contentEditable?: ReactElement`
- `className?: string`
- `classNames?: { container?: string; contentEditable?: string; placeholder?: string }`
- `styles?: { container?: CSSProperties; contentEditable?: CSSProperties; placeholder?: CSSProperties }`
- `nonEditableVisualMode?: boolean`
- `onEditIntent?: ({ clientX, clientY }) => void`
- `errorBoundary?: React.ComponentType<{ children; onError }>`

## Built-in extension catalog

### Formatting and structure

- `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`
- `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`
- `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`
- `textColorExtension`, `textHighlightExtension`
- `linkExtension`, `blockFormatExtension`, `listExtension`, `tabIndentExtension`
- `horizontalRuleExtension`, `tableExtension`, `enterKeyBehaviorExtension`
- `codeExtension`, `codeIntelligenceExtension`

### Interaction and productivity

- `historyExtension`
- `commandPaletteExtension`
- `slashCommandExtension`
- `floatingToolbarExtension`
- `contextMenuExtension`
- `draggableBlockExtension`
- `emojiExtension`

### Media

- `imageExtension`
- `iframeEmbedExtension`
- `youTubeEmbedExtension`

### Custom

- `createCustomNodeExtension(...)`
- `createExtension(...)`
- `BaseExtension` (advanced class-based extension model)

## Config and typed helpers exported from extensions

- Font:
  - `FontFamilyConfig`, `FontFamilyOption`, `FontCssLoadStrategy`
  - `FontSizeConfig`, `FontSizeOption`
  - `LineHeightConfig`, `LineHeightOption`
- Color:
  - `TextColorConfig`, `TextColorOption`
  - `TextHighlightConfig`, `TextHighlightOption`
- Code:
  - `CodeExtensionConfig` (`showLineNumbers` support for visual code blocks)
  - `CodeIntelligenceConfig`, `CodeIntelligenceCommands`
  - `CodeHighlightProvider`, `CodeHighlightProviderConfig`
  - `CodeLanguageOptionsMode`, `CodeLanguageOptionsConfig` (UI labels use full language names)
- Table/media/draggable:
  - `TableConfig`
  - `DraggableConfig`
  - media command/config types from `media/types`
- Emoji:
  - `EmojiConfig`, `EmojiCommands`, `EmojiStateQueries`
  - `EmojiCatalogAdapter`, `EmojiCatalogItem`, `EmojiSuggestionState`
  - `LIGHTWEIGHT_EMOJI_CATALOG`

## Export/import workflows

```tsx
import { jsonToHTML, jsonToMarkdown } from '@lyfie/luthor-headless';

function SaveButton() {
  const { export: exportApi } = useEditor();

  const save = () => {
    const json = exportApi.toJSON();
    console.log({
      json,
      markdown: jsonToMarkdown(json),
      html: jsonToHTML(json),
    });
  };

  return <button onClick={save}>Save</button>;
}
```

Use metadata-free conversion when your source workflow should never emit `luthor:meta` comments:

```tsx
const markdown = jsonToMarkdown(json, { metadataMode: 'none' });
const html = jsonToHTML(json, { metadataMode: 'none' });
```

## Custom extension example (`createExtension`)

```tsx
import { $createParagraphNode, $getRoot } from 'lexical';
import { createExtension, ExtensionCategory } from '@lyfie/luthor-headless';

export const clearDocumentExtension = createExtension({
  name: 'clearDocument',
  category: [ExtensionCategory.Toolbar],
  commands: (editor) => ({
    clearDocument: () => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
    },
  }),
});
```

## Choosing extension authoring style

- Use `createExtension(...)` for straightforward command/plugin additions.
- Use `BaseExtension` when you need:
  - richer lifecycle behavior
  - custom config patterns
  - explicit class-based extension architecture

## Related pages

- [Architecture](/docs/luthor-headless/architecture/)
- [Features](/docs/luthor-headless/features/)
- [Metadata Comment System](/docs/luthor-headless/metadata-comment-system/)
