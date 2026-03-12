---
title: Extensive Editor
description: Full-feature preset and core prop reference.
---

# Extensive Editor

`ExtensiveEditor` is the base preset in `@lyfie/luthor`.  
Every other preset is a focused wrapper around this component.

## Usage

```tsx
import { ExtensiveEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

## Default behavior snapshot

| Category | Default |
| --- | --- |
| Theme | `initialTheme="light"` |
| Mode | `initialMode="visual-editor"` |
| Available modes | `["visual-editor", "visual-only", "json", "markdown", "html"]` |
| Toolbar | Enabled, top, left-aligned |
| Feature flags | All enabled by default |
| Line height baseline | `minimumDefaultLineHeight = 1.5` |
| List indentation | `maxListIndentation = 8` sub-indent levels |

## Core props (high signal)

- Content and mode:
  - `defaultContent`, `showDefaultContent`, `placeholder`
  - `initialMode`, `defaultEditorView`, `availableModes`
  - `isEditorViewTabsVisible` (`isEditorViewsTabVisible` legacy alias)
- Toolbar:
  - `isToolbarEnabled`, `isToolbarPinned`
  - `toolbarPosition`, `toolbarAlignment`, `toolbarLayout`, `toolbarVisibility`
  - `toolbarClassName`, `toolbarStyleVars`
- Editing behavior:
  - `featureFlags`
  - `editOnClick` (promote `visual-only` to editable `visual-editor`)
  - `headingOptions`, `paragraphLabel`, `syncHeadingOptionsWithCommands`
  - `slashCommandVisibility`, `shortcutConfig`, `commandPaletteShortcutOnly`
- Theme and style:
  - `theme`, `editorThemeOverrides`
  - `initialTheme`, `onThemeChange`
  - `defaultSettings`, `quoteClassName`, `quoteStyleVars`
- Typography/code options:
  - `fontFamilyOptions`, `fontSizeOptions`, `lineHeightOptions`
  - `minimumDefaultLineHeight`, `scaleByRatio`
  - `syntaxHighlighting`, `codeHighlightProvider`, `loadCodeHighlightProvider`
  - `maxAutoDetectCodeLength`, `isCopyAllowed`, `languageOptions`
  - `maxListIndentation`

For the full prop-by-prop contract, including every field, see [Props Reference](/docs/luthor/props-reference/).

## Mode behavior details

- `visual-editor`: normal editable visual mode.
- `visual-only`: read mode visual surface. If `editOnClick` is true (default), click can promote to editable mode and place caret near click point.
- `visual`: accepted legacy alias that maps internally to `visual-editor`.
- `json`, `markdown`, `html`: source modes with conversion validation on switch.

If source parsing fails, an inline source error panel is shown and visual content is preserved.

## Lists in Extensive

- Ordered, unordered, and checklist styles are supported.
- `maxListIndentation` applies to all list types.
- Checklist variants:
  - `strikethrough` (default)
  - `plain`
- Style tokens can be rehydrated from imported JSON.

## Theme callback example (`highlight.js`)

Use `onThemeChange` when host styling must follow editor theme state.

```tsx
'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const HIGHLIGHT_THEME_LINK_ID = 'luthor-highlightjs-theme';

export function EditorWithHighlightTheme() {
  const [editorTheme, setEditorTheme] = useState<Theme>('light');

  useEffect(() => {
    const href = editorTheme === 'dark' ? '/highlightjs/github-dark.css' : '/highlightjs/github.css';
    const existing = document.getElementById(HIGHLIGHT_THEME_LINK_ID);
    const link = existing instanceof HTMLLinkElement ? existing : document.createElement('link');

    if (!(existing instanceof HTMLLinkElement)) {
      link.id = HIGHLIGHT_THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (link.href !== new URL(href, window.location.origin).href) {
      link.href = href;
    }
  }, [editorTheme]);

  return <ExtensiveEditor initialTheme="light" onThemeChange={setEditorTheme} />;
}
```

Place these files in your app static assets:

- `/public/highlightjs/github.css`
- `/public/highlightjs/github-dark.css`

## Ref API

- `injectJSON(content: string): void`
- `getJSON(): string`
- `getMarkdown(): string`
- `getHTML(): string`

```tsx
import { useRef } from 'react';
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor';

export function SaveExample() {
  const editorRef = useRef<ExtensiveEditorRef>(null);

  const save = () => {
    const methods = editorRef.current;
    if (!methods) return;
    console.log({
      json: methods.getJSON(),
      markdown: methods.getMarkdown(),
      html: methods.getHTML(),
    });
  };

  return (
    <>
      <button onClick={save}>Save</button>
      <ExtensiveEditor ref={editorRef} />
    </>
  );
}
```
