---
title: "@lyfie/luthor-headless"
description: Minimal setup and validation for @lyfie/luthor-headless.
---

# @lyfie/luthor-headless

Use `@lyfie/luthor-headless` when you need complete control over editor behavior and UI.

## Install

```bash
npm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

`@lexical/code` already installs `prismjs`, so you do not need an extra Prism dependency.
`@lyfie/luthor-headless` stays lightweight and does not preload a Prism language bundle or theme helper.
Default code highlighting works with Lexical-loaded grammars. If you need extra grammars or a custom tokenizer, configure your own runtime provider via `codeExtension` / `codeIntelligenceExtension`.

## Render a minimal headless editor

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

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## Validate installation

1. The editor mounts and accepts input.
2. Toolbar buttons call typed commands (`toggleBold`, `toggleItalic`).
3. `activeStates` updates correctly when formatting changes.
4. No Lexical peer dependency warnings appear.

## Why headless

- You control toolbar UX, command wiring, and layout.
- You decide exactly which extensions are mounted.
- You can keep JSON-first persistence and convert to Markdown/HTML when needed.
- You can build product-specific blocks with `createCustomNodeExtension(...)` or `createExtension(...)`.

## Learn more about Lexical

`@lyfie/luthor-headless` is built on top of Lexical. For deeper engine capabilities and low-level APIs, use the official Lexical documentation: [lexical.dev/docs](https://lexical.dev/docs/intro).

## Deep-dive docs

- [Architecture](/docs/luthor-headless/architecture/)
- [Extensions and API](/docs/luthor-headless/extensions-and-api/)
- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)
- [Feature groups](/docs/luthor-headless/features/)
