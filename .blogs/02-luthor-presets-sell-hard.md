---
title: Preset or Headless? How I Pick the Right Luthor Setup in 5 Minutes
description: A practical guide to choosing @lyfie/luthor presets or @lyfie/luthor-headless for React rich text editors, with simple rules and copy-paste examples.
slug: luthor-preset-vs-headless-guide
keywords:
  - react editor
  - lexical headless editor
  - rich text editor guide
  - markdown html editor
  - typescript react
---

![Luthor logo](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo.png)

# Preset or Headless? How I Pick the Right Luthor Setup in 5 Minutes

I use one simple rule: pick the fastest path that still gives me room to grow.

## If I need a React editor live today: use `@lyfie/luthor`

This is my default when I want a polished editor without wiring everything manually.

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

Why I pick presets:

- quick integration
- ready toolbars and slash flows
- visual + source modes in one place
- clean upgrade path to deeper control

![Preset editor flow](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature4.gif)

## If I need total UI control: use `@lyfie/luthor-headless`

When product requirements are custom, this gives me typed building blocks instead of fixed UI.

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function App() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

Why I pick headless:

- custom toolbar and custom UX from day one
- extension-first architecture
- strong TypeScript command/state contracts
- native JSON/Markdown/HTML conversion APIs

![Headless customization demo](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature12.gif)

## If source content matters: use MD or HTML presets

The latest updates improved native markdown/html workflows, so these presets are now cleaner for source-first apps.

```tsx
import { MDEditor, HTMLEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function MarkdownScreen() {
  return <MDEditor defaultEditorView="markdown" />;
}

export function HtmlScreen() {
  return <HTMLEditor defaultEditorView="html" />;
}
```

![Markdown and HTML source mode flow](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature6.gif)

## My default decision matrix

- Need shipping speed: `@lyfie/luthor`
- Need custom product UX: `@lyfie/luthor-headless`
- Need markdown/html-native authoring: `MDEditor` or `HTMLEditor`
- Need read-only viewing with clean edit handoff: `visual-only` mode in `ExtensiveEditor`

## Final note

I do not want editor drama in a sprint.
I want stable APIs, clear behavior, and a path that does not trap me later.

That is exactly why I use Luthor this way.
