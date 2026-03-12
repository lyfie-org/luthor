---
title: Features
description: Grouped feature documentation for @lyfie/luthor-headless.
---

# Features

Feature docs are grouped by real implementation areas so you can find APIs faster.

## Contributor guides

- [Architecture](/docs/luthor-headless/architecture/)
- [Extensions and API](/docs/luthor-headless/extensions-and-api/)
- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)

## Feature groups

- [Typography and Text](/docs/luthor-headless/features/typography-and-text/)
- [Structure and Lists](/docs/luthor-headless/features/structure-and-lists/)
- [Media and Embeds](/docs/luthor-headless/features/media-and-embeds/)
- [Code and Devtools](/docs/luthor-headless/features/code-and-devtools/)
- [Interaction and Productivity](/docs/luthor-headless/features/interaction-and-productivity/)
- [Customization and Theming](/docs/luthor-headless/features/customization-and-theming/)

For deeper engine-level capability details, see the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).

## Base runtime example

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

## How to read this section

- Each feature-group page lists:
  - extensions involved
  - high-signal commands
  - practical setup examples
- If you are building a preset-like experience in your app, start with:
  1. Typography and Text
  2. Structure and Lists
  3. Interaction and Productivity
