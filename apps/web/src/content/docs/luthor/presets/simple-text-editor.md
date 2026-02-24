---
title: Simple Text
description: Minimal text-focused preset with constrained editing modes.
---

# Simple Text

Minimal plain-text style preset built on top of `ExtensiveEditor`.

## Usage

```tsx
import { SimpleTextEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <SimpleTextEditor placeholder="Start writing..." />;
}
```

## Props

`SimpleTextEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, `initialMode`, and `toolbarVisibility`.

- `hideToolbarByDefault`: `true (default) | false`

## Behavior

- Forces visual-only mode
- Disables most rich features by preset defaults

