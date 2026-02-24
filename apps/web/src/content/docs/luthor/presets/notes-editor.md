---
title: Notes
description: Notes-style preset with title and action controls.
---

# Notes

Notes-style preset with title and action controls.

## Usage

```tsx
import { NotesEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <NotesEditor
      showTitle
      title="Sprint Notes"
      onTitleChange={(value) => console.log(value)}
      onPin={() => console.log('pin')}
      onArchive={() => console.log('archive')}
    />
  );
}
```

## Props

`NotesEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.

- `showTitle`: `true (default) | false`
- `title`: `'' (default) | string`
- `onTitleChange`: `undefined (default) | (value: string) => void`
- `showActions`: `true (default) | false`
- `onPin`: `undefined (default) | () => void`
- `onArchive`: `undefined (default) | () => void`
- `onColorChange`: `undefined (default) | (color: string) => void`
- `colorOptions`: `['#fef3c7', '#dbeafe', '#dcfce7'] (default) | readonly string[]`

## Behavior

Toolbar is disabled by preset default and feature set is tuned for lightweight note taking.

