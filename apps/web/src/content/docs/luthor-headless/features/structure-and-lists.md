---
title: Structure and Lists
description: Headings, links, lists, tables, and document structure tools.
---

# Structure and Lists

This group covers links, headings, paragraphs, lists, and table workflows.

## Included extensions

- `linkExtension`
- `blockFormatExtension`
- `listExtension`
- `tableExtension`
- `horizontalRuleExtension`
- `tabIndentExtension`

## List depth and marker patterns

- List indentation is capped at `8` sub-indent levels (`9` total levels including top-level).
- `listExtension` supports ordered and unordered marker patterns through:
  - `commands.setOrderedListPattern(pattern)`
  - `commands.setUnorderedListPattern(pattern)`
  - `commands.setOrderedListSuffix('dot' | 'paren')`
- Checklist variants are available through:
  - `commands.setCheckListVariant('strikethrough' | 'plain')`

## Example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  linkExtension,
  blockFormatExtension,
  listExtension,
  tableExtension,
  horizontalRuleExtension,
  tabIndentExtension,
} from '@lyfie/luthor-headless';

const extensions = [
  richTextExtension,
  linkExtension,
  blockFormatExtension,
  listExtension,
  tableExtension,
  horizontalRuleExtension,
  tabIndentExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleUnorderedList?.()}>Bullets</button>
      <button onClick={() => commands.toggleOrderedList?.()}>Numbers</button>
      <button onClick={() => commands.insertLink?.('https://example.com')}>Link</button>
      <button onClick={() => commands.insertTable?.({ rows: 3, columns: 3 })}>3x3 Table</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Structure your document..." />
    </Provider>
  );
}
```
