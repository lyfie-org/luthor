---
title: Legacy Rich Editor
description: Shared metadata-free rich editor profile powering both MD and HTML presets.
---

# Legacy Rich Editor

`LegacyRichEditor` is a shared metadata-free editor profile that powers both `MDEditor` and `HTMLEditor`.

Use it when you want the same native feature set and switch only the source tab mode between markdown and html.

## Usage

```tsx
import { LegacyRichEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <LegacyRichEditor
      sourceFormat="markdown"
      defaultEditorView="markdown"
    />
  );
}
```

## Props

`LegacyRichEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.

- `sourceFormat`: `'markdown' (default) | 'html'`
- `initialMode`: `'visual' (default) | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)
- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (metadata-heavy features remain disabled)

## Behavior

- Shared native profile:
  - headings, paragraph, quote
  - bold, italic, strikethrough, inline code
  - code block
  - links
  - ordered/unordered/check lists + indentation
  - horizontal rule
- Disabled to keep metadata-free round trips:
  - tables, images, embeds, custom nodes, draggable block, emoji, slash/command palette, theme toggle
- Source views:
  - `sourceFormat="markdown"` uses Visual/JSON/Markdown tabs
  - `sourceFormat="html"` uses Visual/JSON/HTML tabs
