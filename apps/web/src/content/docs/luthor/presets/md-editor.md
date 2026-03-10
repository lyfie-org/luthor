---
title: MD Editor
description: Visual and markdown mode preset with mode-switch behavior.
---

# MD Editor

Markdown-native preset with visual editing plus JSON/Markdown source tabs.

Internally this preset is a `LegacyRichEditor` wrapper with `sourceFormat="markdown"`.

## Usage

```tsx
import { MDEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <MDEditor defaultEditorView="markdown" />;
}
```

## Props

`MDEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.

- `initialMode`: `'visual' (default) | 'json' | 'markdown'`
- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Provides markdown-native formatting (headings, lists, links, quote, inline code, code block, horizontal rule), uses Visual/JSON/Markdown tabs, keeps toolbar enabled, and disables draggable blocks plus metadata-heavy features like embeds, media, and custom nodes.

