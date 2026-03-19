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

- `initialMode`: `'visual' (default) | 'visual-only' | 'json' | 'markdown'`
- `defaultEditorView`: `'visual' (default) | 'visual-only' | 'json' | 'markdown'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Provides GitHub-compatible markdown formatting (headings, links, quote, inline code, fenced code blocks, ordered/unordered/task lists, tables, images, horizontal rules, and alignment controls), supports common README-style inline HTML wrappers (`<div align>`, `<p align>`, `<picture>`, `<img>`, `<figure>/<figcaption>`), preserves linked badge images (`[![...]](...)`), restores GitHub alert and footnote syntax on export, keeps mermaid/math fences stable, uses Visual Only/Visual/JSON/Markdown tabs, keeps toolbar enabled, and treats markdown as the canonical source when switching between views.

Alignment details:
- Imports both GitHub wrappers and legacy inline `<!-- align:* -->` hints.
- Metadata-free markdown export emits GitHub-friendly `<p align="...">` wrappers instead of alignment comments.

## Default modes

- `availableModes`: `["visual-only", "visual", "json", "markdown"]`

## Good fit

- Documentation tools
- Markdown content pipelines
- Apps that persist markdown or run markdown-first review workflows

