---
title: Slash Editor
description: Slash-first preset with draggable and command-focused defaults.
---

# Slash Editor

Slash-first preset with draggable-focused defaults.

## Usage

```tsx
import { SlashEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <SlashEditor showDefaultContent={false} />;
}
```

## Props

`SlashEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`, then re-adds both.

- `slashVisibility`: `undefined (default) | SlashCommandVisibility`
- `isDraggableEnabled`: `true (default) | false`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `isToolbarEnabled`: `false (default) | true`

## Behavior

Defaults keep toolbar hidden, enable draggable blocks, and provide a curated slash-command list for basic editing actions (headings, lists, quote, code block, inline code, bold/italic, links, horizontal rule, table) across Visual/JSON/Markdown/HTML views.

