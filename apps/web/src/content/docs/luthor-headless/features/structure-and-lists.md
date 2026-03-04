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
- `ListExtension` supports `maxDepth` configuration for custom depth caps.
- `TabIndentExtension` supports `maxListDepth` so `Tab`/`Shift+Tab` behavior can match list depth limits.
- Depth caps apply uniformly to ordered lists, unordered lists, and checklists.
- `listExtension` supports ordered and unordered marker patterns through:
  - `commands.setOrderedListPattern(pattern)`
  - `commands.setUnorderedListPattern(pattern)`
  - `commands.setOrderedListSuffix('dot' | 'paren')`
- Supported unordered patterns:
  - `disc-circle-square`
  - `arrow-diamond-disc`
  - `square-square-square`
  - `arrow-circle-square`
- Checklist variants are available through:
  - `commands.setCheckListVariant('strikethrough' | 'plain')`
  - `strikethrough`: checked items render with line-through text.
  - `plain`: checked items keep normal text without line-through.
- Checklist variant and unordered marker pattern tokens are stored on list/list-item styles, so imported JSON can be rehydrated with `commands.rehydrateListStyles()`.

### Depth configuration example

```tsx
import {
  createEditorSystem,
  RichText,
  ListExtension,
  TabIndentExtension,
} from '@lyfie/luthor-headless';

const MAX_SUB_INDENT = 5;
const maxDepth = MAX_SUB_INDENT + 1; // include top-level

const extensions = [
  new ListExtension({ maxDepth }),
  new TabIndentExtension({ maxListDepth: maxDepth }),
] as const;

const { Provider } = createEditorSystem<typeof extensions>();

export function App() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder="Write..." />
    </Provider>
  );
}
```

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
