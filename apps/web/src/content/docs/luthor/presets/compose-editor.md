---
title: Rich Text Input
description: Focused rich text compose preset with optional recipient rows.
---

# Rich Text Input

`ComposeEditor` merges focused rich-text and draft-composition workflows into one surface.

Use it as a clean rich editor, or enable recipient/subject rows when needed.

## Usage

```tsx
import { ComposeEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ComposeEditor
      compactToolbar
      showTo
      showCc
      showSubject
      placeholder="Write your draft..."
    />
  );
}
```

## Props

`ComposeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.

- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `compactToolbar`: `false (default) | true`
- `showRecipients`: `false (default) | true`
- `showTo`: `false (default) | true`
- `showCc`: `false (default) | true`
- `showBcc`: `false (default) | true`
- `showSubject`: `false (default) | true`

## Behavior

- Defaults to focused formatting with media/embed-heavy features disabled.
- Optional recipient rows render above the editor shell.
- Supports feature flag overrides for deeper tuning.

