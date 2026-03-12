---
title: React Rich Text Editor That Just Works
description: I built Luthor for developers who want a React rich text editor that works fast, with visual-only mode, native Markdown and HTML workflows, and TypeScript APIs.
slug: luthor-react-rich-text-editor-that-just-works
keywords:
  - react rich text editor
  - lexical editor
  - typescript editor
  - markdown editor
  - html editor
---

![Luthor logo](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal.png)

# React Rich Text Editor That Just Works

I am a simple developer. I just want code that works, no questions asked.

That is exactly why I built Luthor in two layers:

- `@lyfie/luthor` for fast, preset-based shipping
- `@lyfie/luthor-headless` for full control when I need custom UX

Quick links:

- npm (`@lyfie/luthor`): https://www.npmjs.com/package/@lyfie/luthor
- npm (`@lyfie/luthor-headless`): https://www.npmjs.com/package/@lyfie/luthor-headless
- docs: https://www.luthor.fyi/docs/getting-started/index
- demo: https://www.luthor.fyi/demo
- license: https://github.com/lyfie-org/luthor/blob/main/LICENSE

## What changed recently

Recent updates that matter in day-to-day work:

- `ExtensiveEditor` now supports `visual-only` mode with `editOnClick` for cleaner read/view flows.
- MD/HTML presets now better preserve native markdown/html behavior for cleaner source workflows.
- Read-only interaction behavior improved across lists, tables, embeds, images, and code-related flows.
- Headless preset styling and responsive polish were improved.
- CI quality gates now run lint, test, build, release-hardening, and web SEO validation in one workflow.

![Visual editing and formatting](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature1.gif)

## Fast path: ship with presets

If I need to ship this week, I use presets first.

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

Available presets right now:

- `ExtensiveEditor`
- `ComposeEditor`
- `SimpleEditor`
- `LegacyRichEditor`
- `MDEditor`
- `HTMLEditor`
- `SlashEditor`
- `HeadlessEditorPreset`

![Slash commands and quick actions](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature11.gif)

## Control path: go headless when product needs it

If the UI needs to be fully custom, I switch to `@lyfie/luthor-headless`.

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>
        Bold
      </button>
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

![Custom workflows and code support](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature8.gif)

## Why this stack is practical

- I can launch fast with presets.
- I can move to headless without rewriting the whole editor.
- Source modes (`json`, `markdown`, `html`) are built in.
- License is MIT, so no feature paywall drama later.

![Embeds and rich media workflows](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature7.gif)

## Final take

If you want a **React rich text editor** that works right now, start with `@lyfie/luthor`.
If you need deep customization later, move to `@lyfie/luthor-headless`.

That is the workflow I use myself: ship first, customize when needed, keep everything clean.
