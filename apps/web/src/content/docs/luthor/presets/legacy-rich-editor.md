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
      defaultEditorView="markdown"
    />
  );
}
```

## Props

`LegacyRichEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, `initialMode`, and `defaultEditorView`, then re-adds constrained variants:

- `sourceFormat`: `'both' (default) | 'markdown' | 'html'`
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
- Disabled by default to keep metadata-light markdown/html round trips:
  - tables, images, embeds, custom nodes, draggable block, emoji, slash/command palette, theme toggle
- Source views:
  - `sourceFormat="both"` uses Visual/Markdown/HTML tabs
  - `sourceFormat="markdown"` uses Visual/JSON/Markdown tabs
  - `sourceFormat="html"` uses Visual/JSON/HTML tabs

## Toolbar profile

Default toolbar sections focus on writing and structure:

- Undo/redo
- Block format + quote
- Bold/italic/strikethrough/inline code/link
- Ordered/unordered/checklist + indent/outdent
- Code block + horizontal rule
