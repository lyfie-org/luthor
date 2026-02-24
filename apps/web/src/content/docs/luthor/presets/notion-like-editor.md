---
title: Notion Like
description: Slash-first preset with draggable and command-focused defaults.
---

# Notion Like

Slash-first preset with draggable-focused defaults.

## Usage

```tsx
import { NotionLikeEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <NotionLikeEditor isDraggableEnabled slashVisibility={{ allowlist: ['block.paragraph'] }} />;
}
```

## Props

`NotionLikeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`, then re-adds both.

- `slashVisibility`: `undefined (default) | SlashCommandVisibility`
- `isDraggableEnabled`: `true (default) | false`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `isToolbarEnabled`: `false (default) | true`

## Behavior

Defaults enable slash commands, draggable blocks, and command palette while keeping toolbar hidden.

