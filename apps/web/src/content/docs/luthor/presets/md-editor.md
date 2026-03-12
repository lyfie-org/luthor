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

`MDEditorProps` inherits `LegacyRichEditorProps`, then fixes source behavior to markdown.

- `initialMode`: `'visual' (default) | 'json' | 'markdown'`
- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Provides markdown-native formatting (headings, lists, links, quote, inline code, code block, horizontal rule), uses Visual/JSON/Markdown tabs, keeps toolbar enabled, and disables metadata-heavy features by default.

## Default modes

- `availableModes`: `["visual", "json", "markdown"]`

## Good fit

- Documentation tools
- Markdown content pipelines
- Apps that persist markdown or run markdown-first review workflows

