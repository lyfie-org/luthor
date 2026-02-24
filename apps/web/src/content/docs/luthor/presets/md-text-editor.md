---
title: Markdown
description: Visual and markdown mode preset with mode-switch behavior.
---

# Markdown

Preset that switches between visual and markdown editing.

## Usage

```tsx
import { MDTextEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <MDTextEditor initialMode="visual" />;
}
```

## Props

`MDTextEditorProps` inherits `ExtensiveEditorProps` except `availableModes` and `initialMode`.

- `initialMode`: `'visual' (default) | 'markdown'`

## Behavior

- Uses markdown/jsonb conversion when switching modes
- Renders source textarea in markdown mode

