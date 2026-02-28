---
title: Features
description: Grouped feature documentation for @lyfie/luthor-headless.
---

# Features

Feature docs are grouped to match the home page feature set.

## Feature groups

- [Typography and Text](/docs/luthor-headless/features/typography-and-text/)
- [Structure and Lists](/docs/luthor-headless/features/structure-and-lists/)
- [Media and Embeds](/docs/luthor-headless/features/media-and-embeds/)
- [Code and Devtools](/docs/luthor-headless/features/code-and-devtools/)
- [Interaction and Productivity](/docs/luthor-headless/features/interaction-and-productivity/)
- [Customization and Theming](/docs/luthor-headless/features/customization-and-theming/)

For deeper engine-level capability details, see the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).

## Base runtime

```tsx
import { createEditorSystem, RichText, richTextExtension } from '@lyfie/luthor-headless';

const extensions = [richTextExtension] as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function App() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```
