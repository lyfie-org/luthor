---
title: Rich Text
description: Compact rich text preset and prop defaults.
---

# Rich Text

Compact rich text preset for focused editing.

## Usage

```tsx
import { RichTextBoxEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <RichTextBoxEditor compactToolbar />;
}
```

## Props

`RichTextBoxEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.

- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `compactToolbar`: `false (default) | true`

## Behavior

Default feature flags enable core formatting and disable heavier media/embed features unless re-enabled.

