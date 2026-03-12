---
title: Structure and Lists
description: Headings, links, lists, tables, and document structure tools.
---

# Structure and Lists

This group covers links, block structure, list systems, horizontal rules, and tables.

## Included extensions

- `linkExtension`
- `blockFormatExtension`
- `listExtension`
- `tableExtension`
- `horizontalRuleExtension`
- `tabIndentExtension`

## Key commands

- Links:
  - `insertLink`, `updateLink`, `removeLink`
  - `getCurrentLink`, `getLinkByKey`, `updateLinkByKey`, `removeLinkByKey`
- Block structure:
  - `toggleParagraph`, `toggleHeading`, `toggleQuote`
  - `setTextAlignment`
- Lists:
  - `toggleUnorderedList`, `toggleOrderedList`, `toggleCheckList`
  - `indentList`, `outdentList`
  - `setOrderedListPattern`, `setOrderedListSuffix`
  - `setUnorderedListPattern`, `setCheckListVariant`
  - `rehydrateListStyles`
- Tables/rules:
  - `insertTable`
  - `insertHorizontalRule`

## List depth and marker patterns

- Default list sub-indent cap in extensive presets is `8`.
- `ListExtension` supports `maxDepth` configuration.
- `TabIndentExtension` supports `maxListDepth`.
- Caps apply to ordered, unordered, and checklist nodes.

Ordered list controls:

- `setOrderedListPattern(pattern)` with patterns:
  - `decimal-alpha-roman`
  - `decimal-hierarchical`
  - `upper-roman-upper-alpha`
  - `upper-alpha-lower-alpha`
  - `decimal-leading-zero-alpha`
- `setOrderedListSuffix('dot' | 'paren')`

Unordered/checklist controls:

- `setUnorderedListPattern(pattern)`:
  - `disc-circle-square`
  - `arrow-diamond-disc`
  - `square-square-square`
  - `arrow-circle-square`
- `setCheckListVariant('strikethrough' | 'plain')`

## Depth configuration example

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
