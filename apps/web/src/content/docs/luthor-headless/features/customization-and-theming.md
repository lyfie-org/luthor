---
title: Customization and Theming
description: Custom nodes, theme tokens, and extension-level customization.
---

# Customization and Theming

This group covers custom node composition and theme token control.

## Included APIs

- `createCustomNodeExtension`
- `createExtension`
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

## Practical notes

- Keep custom nodes small and composable.
- Use typed payloads in custom node creation to avoid implicit schema drift.
- Prefer token-level theme overrides over ad-hoc CSS overrides whenever possible.
