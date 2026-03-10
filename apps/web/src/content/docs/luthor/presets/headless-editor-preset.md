---
title: Headless Editor
description: Reference preset showing direct headless composition.
---

# Headless Editor

Basic rich-text preset with lightweight defaults and source tabs.

## Usage

```tsx
import { HeadlessEditorPreset } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <HeadlessEditorPreset defaultEditorView="visual" />;
}
```

## Props

`HeadlessEditorPresetProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.

- `initialMode`: `'visual' (default) | 'json' | 'markdown' | 'html'`
- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown' | 'html'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Uses a text-pill toolbar (bold/italic/strike/inline code, block controls, lists, code block, quote, HR, hard break, undo/redo), supports Visual/JSON/MD/HTML tabs, and keeps draggable blocks plus metadata-heavy features disabled.


