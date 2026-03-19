---
title: Legacy Rich Editor
description: Shared metadata-free rich editor profile powering both MD and HTML presets.
---

# Legacy Rich Editor

`LegacyRichEditor` is a shared metadata-free editor profile that powers both `MarkDownEditor` and `HTMLEditor`.

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
- `initialMode`: `'visual' (default) | 'visual-only' | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)
- `defaultEditorView`: `'visual' (default) | 'visual-only' | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)
- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (metadata-heavy features remain disabled)

## Behavior

- Shared native profile:
  - headings, paragraph, quote
  - bold, italic, strikethrough, inline code
  - code block with language selector and copy control
  - links
  - alignment controls (left/center/right/justify)
  - ordered/unordered/check lists with indent/outdent controls for nested sublists
  - tables and images
  - horizontal rule
  - theme toggle
- Disabled by default to keep metadata-free markdown/html round trips:
  - embeds, custom nodes, draggable block, emoji, slash/command palette
- Source views:
  - `sourceFormat="both"` uses Visual Only/Visual/Markdown/HTML tabs
  - `sourceFormat="markdown"` uses Visual Only/Visual/JSON/Markdown tabs
  - `sourceFormat="html"` uses Visual Only/Visual/JSON/HTML tabs
  - line numbers are enabled by default in visual code blocks and source tabs (`showLineNumbers=true`)

## Toolbar profile

Default toolbar sections focus on writing and structure:

- Undo/redo
- Block format + quote + alignment controls
- Bold/italic/strikethrough/inline code/link
- Ordered/unordered/checklist
- List style dropdown arrows are hidden in this preset family; each list button inserts the preset default list style directly.
- Code block + horizontal rule + table + image
- Theme toggle

## Theme and syntax colors

Because `themeToggle` is enabled in this preset family, wire `onThemeChange` to switch `highlight.js` CSS for code color parity:

- local/public (light): `/public/highlightjs/github.css`
- local/public (dark): `/public/highlightjs/github-dark.css`
- CDN (light): `https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css`
- CDN (dark): `https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css`

Code tokens render with color only when these highlight styles (or equivalent custom `.hljs*` styles) are loaded.
