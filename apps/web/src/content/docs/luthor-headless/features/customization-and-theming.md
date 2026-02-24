---
title: Customization and Theming
description: Custom nodes, theme tokens, and extension-level customization.
---

# Customization and Theming

This group covers custom block logic and theming APIs.

## Included APIs

- `createCustomNodeExtension`
- `defaultLuthorTheme`
- `mergeThemes`
- `createEditorThemeStyleVars`

## Example: custom extension

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  createCustomNodeExtension,
} from '@lyfie/luthor-headless';

const calloutExtension = createCustomNodeExtension({
  key: 'callout',
  category: 'block',
  nodeType: 'element',
  createNode: ({ $createParagraphNode, $createTextNode }) => {
    const node = $createParagraphNode();
    node.append($createTextNode('Callout block'));
    return node;
  },
});

const extensions = [richTextExtension, calloutExtension] as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function App() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder="Custom editor..." />
    </Provider>
  );
}
```

## Example: theme override

```ts
import { mergeThemes, defaultLuthorTheme } from '@lyfie/luthor-headless';

const theme = mergeThemes(defaultLuthorTheme, {
  colors: {
    background: '#0b1020',
    foreground: '#f8fafc',
  },
});
```
