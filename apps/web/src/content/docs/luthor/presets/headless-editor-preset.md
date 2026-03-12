---
title: Headless Editor
description: Reference preset showing direct headless composition.
---

# Headless Editor

`HeadlessEditorPreset` is a lightweight, source-aware preset with a simple text-pill toolbar.

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

Uses a text-pill toolbar (bold/italic/strike/inline code, block controls, lists, code block, quote, horizontal rule, hard break, undo/redo), supports Visual/JSON/Markdown/HTML tabs, and keeps metadata-heavy features disabled by default.

## Default mode profile

- `availableModes`: `["visual", "json", "markdown", "html"]`

## Default feature profile

Enabled by default:

- `bold`, `italic`, `strikethrough`, `list`, `history`
- `blockFormat`, `code`, `codeFormat`
- `horizontalRule`, `tabIndent`, `enterKeyBehavior`

Disabled and enforced off:

- `table`, `image`, `iframeEmbed`, `youTubeEmbed`
- `customNode`, `slashCommand`, `commandPalette`
- `contextMenu`, `floatingToolbar`, `draggableBlock`, `themeToggle`

## Ref API

`HeadlessEditorPreset` forwards the same imperative methods as `ExtensiveEditorRef`:

- `injectJSON(content: string): void`
- `getJSON(): string`
- `getMarkdown(): string`
- `getHTML(): string`

Example:

```tsx
import { useRef } from 'react';
import { HeadlessEditorPreset, type ExtensiveEditorRef } from '@lyfie/luthor';

export function SaveHeadlessPresetData() {
  const editorRef = useRef<ExtensiveEditorRef>(null);

  return (
    <>
      <button
        onClick={() => {
          const methods = editorRef.current;
          if (!methods) return;

          const snapshot = {
            json: methods.getJSON(),
            markdown: methods.getMarkdown(),
            html: methods.getHTML(),
          };
          console.log(snapshot);
        }}
      >
        Save
      </button>
      <HeadlessEditorPreset ref={editorRef} />
    </>
  );
}
```


