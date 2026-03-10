---
title: Compose Editor
description: Focused rich text drafting preset with a compact, practical toolbar.
---

# Compose Editor

`ComposeEditor` merges focused rich-text and draft-composition workflows into one surface.

Use it as a clean rich editor with a constrained feature set for practical drafting flows.

## Usage

```tsx
import { ComposeEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ComposeEditor
      compactToolbar
      placeholder="Write your draft..."
    />
  );
}
```

## Props

`ComposeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.

- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `compactToolbar`: `false (default) | true`

## Behavior

- Defaults to focused formatting with media/embed-heavy features disabled.
- Supports feature flag overrides for deeper tuning.

