---
title: MD Editor
description: Visual and markdown mode preset with mode-switch behavior.
---

# MD Editor

Preset that switches between visual and markdown editing.

## Usage

```tsx
import { MDFriendlyEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <MDFriendlyEditor initialMode="visual" />;
}
```

## Props

`MDFriendlyEditorProps` inherits `ExtensiveEditorProps` except `availableModes` and `initialMode`.

- `initialMode`: `'visual' (default) | 'markdown'`

## Behavior

- Converts visual JSON to markdown when switching to markdown mode.
- Parses markdown back into visual JSON when switching back.
- Renders source textarea in markdown mode.

