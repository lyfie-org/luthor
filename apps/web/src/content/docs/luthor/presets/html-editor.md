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

`HTMLEditorProps` inherits `LegacyRichEditorProps`, then fixes source behavior to HTML.

- `initialMode`: `'visual' (default) | 'visual-only' | 'json' | 'html'`
- `defaultEditorView`: `'visual' (default) | 'visual-only' | 'json' | 'html'`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)

## Behavior

Provides HTML-native formatting (headings, lists, links, quote, inline code, code block, tables, images, alignment controls, horizontal rule), uses Visual Only/Visual/JSON/HTML tabs, keeps toolbar enabled, and uses a metadata-free html/json bridge (no `luthor:meta` comments).

## Default modes

- `availableModes`: `["visual-only", "visual", "json", "html"]`

## Good fit

- CMS integrations that store sanitized HTML
- HTML-first publishing pipelines
- Apps with strict HTML output requirements
