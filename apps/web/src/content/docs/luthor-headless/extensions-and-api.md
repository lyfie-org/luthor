---
title: Extensions and API
description: Extension catalog and API usage for createEditorSystem, RichText, and custom extension authoring in @lyfie/luthor-headless.
---

# Extensions and API

This page is the contributor-facing API map for `@lyfie/luthor-headless`.

## Core entry points

- `createEditorSystem`
- `createExtension`
- `RichText` and `richTextExtension`
- `markdownToJSON`, `jsonToMarkdown`, `htmlToJSON`, `jsonToHTML`
- `defaultLuthorTheme`, `mergeThemes`, `createEditorThemeStyleVars`

## Built-in extension catalog

### Formatting and structure

- `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`
- `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`
- `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`
- `textColorExtension`, `textHighlightExtension`
- `linkExtension`, `blockFormatExtension`, `listExtension`, `tabIndentExtension`
- `codeExtension`, `codeIntelligenceExtension`
- `horizontalRuleExtension`, `tableExtension`, `enterKeyBehaviorExtension`

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
- `createExtension(...)` (general-purpose extension factory)

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

## `RichText` props

`RichText` and `RichTextConfig` share these core props:

- `placeholder?: ReactElement | string`
- `contentEditable?: ReactElement`
- `className?: string`
- `classNames?: { container?: string; contentEditable?: string; placeholder?: string }`
- `styles?: { container?: CSSProperties; contentEditable?: CSSProperties; placeholder?: CSSProperties }`
- `nonEditableVisualMode?: boolean`
- `onEditIntent?: ({ clientX, clientY }) => void`
- `errorBoundary?: React.ComponentType<{ children; onError }>`

Use `nonEditableVisualMode` and `onEditIntent` when you need read-only visual mode that promotes to editable mode on user intent.

## `useEditor()` context surface

- `commands`
- `activeStates`
- `stateQueries`
- `listeners.registerUpdate(...)`
- `listeners.registerPaste(...)`
- `export.toJSON()`
- `import.fromJSON(...)`
- `lexical` and `editor`
- `hasExtension(name)`

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

## Choosing an extension authoring style

- Use `createExtension(...)` for straightforward command and plugin additions.
- Use `BaseExtension` subclasses when you need class-level `configure(...)` behavior, richer lifecycle hooks, or custom node registration patterns.

## Related pages

- [/docs/luthor-headless/architecture/](/docs/luthor-headless/architecture/)
- [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)
- [/docs/luthor-headless/features/](/docs/luthor-headless/features/)
