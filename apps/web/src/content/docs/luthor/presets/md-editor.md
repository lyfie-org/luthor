---
title: MarkDown Editor
description: Visual and markdown mode preset with mode-switch behavior.
---

# MarkDown Editor

Markdown-native preset with visual editing plus JSON/Markdown source tabs.

Internally this preset is a `LegacyRichEditor` wrapper with `sourceFormat="markdown"`.

## Usage

```tsx
import { MarkDownEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <MarkDownEditor defaultEditorView="markdown" />;
}
```

## Props

`MarkDownEditorProps` inherits `LegacyRichEditorProps`, then fixes source behavior to markdown.

- `initialMode`: `'visual' (default) | 'visual-only' | 'json' | 'markdown'`
- `defaultEditorView`: `'visual' (default) | 'visual-only' | 'json' | 'markdown'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)
- `showLineNumbers`: `true` by default, applies to visual code blocks and JSON/Markdown source tabs

## Behavior

Provides GitHub-compatible markdown formatting (headings, links, quote, inline code, fenced code blocks, ordered/unordered/task lists, tables, images, horizontal rules, and alignment controls), supports common README-style inline HTML wrappers (`<div align>`, `<p align>`, `<picture>`, `<img>`, `<figure>/<figcaption>`), preserves linked badge images (`[![...]](...)`), restores GitHub alert and footnote syntax on export, keeps mermaid/math fences stable, uses Visual Only/Visual/JSON/Markdown tabs, keeps toolbar enabled, and treats markdown as the canonical source when switching between views.

Code view behavior:

- Syntax highlighting follows your configured highlight provider/theme.
- Line numbers are enabled by default and remain reference-only (not part of copied code text).
- Wrapped source rows are rendered as continuation rows and are not renumbered.

Alignment details:
- Imports both GitHub wrappers and legacy inline `<!-- align:* -->` hints.
- Metadata-free markdown export emits GitHub-friendly `<p align="...">` wrappers instead of alignment comments.

## Default modes

- `availableModes`: `["visual-only", "visual", "json", "markdown"]`

## Good fit

- Documentation tools
- Markdown content pipelines
- Apps that persist markdown or run markdown-first review workflows

