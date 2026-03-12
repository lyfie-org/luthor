---
title: "@lyfie/luthor"
description: Minimal setup and validation for the preset package.
---

# @lyfie/luthor

Use `@lyfie/luthor` when you want a production-ready editor quickly with strong defaults.

## Install

```bash
npm install @lyfie/luthor react react-dom
```

## Render a basic editor

```tsx
import { ExtensiveEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## What you get

- Preset components: `ExtensiveEditor`, `ComposeEditor`, `SimpleEditor`, `LegacyRichEditor`, `MDEditor`, `HTMLEditor`, `SlashEditor`, `HeadlessEditorPreset`
- Source mode workflows (JSON/Markdown/HTML where supported by the preset)
- Feature-flag driven extension composition
- Consistent imperative API on ref (`getJSON`, `getMarkdown`, `getHTML`, `injectJSON`)

## Validate installation

1. You can type in the editor.
2. Toolbar and mode tabs render.
3. No dependency or module resolution errors in your dev server.
4. Export methods return valid JSON/Markdown/HTML from `ExtensiveEditorRef`.

## Pick a preset

- [Extensive Editor](/docs/luthor/presets/extensive-editor/): full feature surface.
- [Compose Editor](/docs/luthor/presets/compose-editor/): focused drafting experience.
- [Simple Editor](/docs/luthor/presets/simple-editor/): messaging input with send controls.
- [Legacy Rich Editor](/docs/luthor/presets/legacy-rich-editor/): metadata-light native markdown/html profile.
- [MD Editor](/docs/luthor/presets/md-editor/): markdown-focused wrapper.
- [HTML Editor](/docs/luthor/presets/html-editor/): HTML-focused wrapper.
- [Slash Editor](/docs/luthor/presets/slash-editor/): slash-first command workflow.
- [Headless Editor](/docs/luthor/presets/headless-editor-preset/): lightweight text-pill toolbar and source tabs.

## Deep-dive docs

- [Architecture](/docs/luthor/architecture/)
- [Props reference](/docs/luthor/props-reference/)
- [Feature flags](/docs/luthor/feature-flags/)
- [Presets](/docs/luthor/presets/)
