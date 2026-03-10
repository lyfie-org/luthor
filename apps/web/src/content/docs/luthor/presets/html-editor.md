---
title: HTML Editor
description: Visual and HTML-focused preset with constrained markdown/html-native features.
---

# HTML Editor

HTML-focused preset with visual editing plus JSON/HTML source tabs.

Internally this preset is a `LegacyRichEditor` wrapper with `sourceFormat="html"`.

## Usage

```tsx
import { HTMLEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <HTMLEditor defaultEditorView="html" />;
}
```

## Props

`HTMLEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.

- `initialMode`: `'visual' (default) | 'json' | 'html'`
- `defaultEditorView`: `'visual' (default) | 'json' | 'html'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Provides markdown/html-native formatting (headings, lists, links, quote, inline code, code block, horizontal rule), uses Visual/JSON/HTML tabs, keeps toolbar enabled, and disables draggable blocks plus metadata-heavy features like embeds, media, and custom nodes.
