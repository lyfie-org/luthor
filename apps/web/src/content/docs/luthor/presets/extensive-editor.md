---
title: Extensive
description: Full-feature preset and core prop reference.
---

# Extensive

`ExtensiveEditor` is the base full-feature preset editor.

## Usage

```tsx
import { ExtensiveEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

## Core props

- `initialTheme`: `'light' (default) | 'dark'`
- `onThemeChange`: `(theme: 'light' | 'dark') => void`
- `showDefaultContent`: `true (default) | false`
- `placeholder`: `'Write anything...' (default) | string | { visual?: string; json?: string }`
- `initialMode`: `'visual' (default) | 'json'`
- `availableModes`: `['visual', 'json'] (default) | ('visual' | 'json')[]`
- `toolbarPosition`: `'top' (default) | 'bottom'`
- `toolbarAlignment`: `'left' (default) | 'center' | 'right'`
- `isToolbarEnabled`: `true (default) | false`
- `minimumDefaultLineHeight`: `1.5 (default) | string | number`
- `scaleByRatio`: `false (default) | true`
- `syncHeadingOptionsWithCommands`: `true (default) | false`
- `commandPaletteShortcutOnly`: `false (default) | true`
- `isCopyAllowed`: `true (default) | false`
- `syntaxHighlighting`: `'auto' | 'disabled'` | extension default behavior if omitted

## Theme callback example (`highlight.js`)

Use `onThemeChange` when host styling must follow the editor's internal theme state (for example, swapping `highlight.js` light/dark styles).

```tsx
'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const HIGHLIGHT_THEME_LINK_ID = 'luthor-highlightjs-theme';

export function EditorWithHighlightTheme() {
  const [editorTheme, setEditorTheme] = useState<Theme>('light');

  useEffect(() => {
    const href =
      editorTheme === 'dark'
        ? '/highlightjs/github-dark.css'
        : '/highlightjs/github.css';

    const existing = document.getElementById(HIGHLIGHT_THEME_LINK_ID);
    const link =
      existing instanceof HTMLLinkElement
        ? existing
        : document.createElement('link');

    if (!(existing instanceof HTMLLinkElement)) {
      link.id = HIGHLIGHT_THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (link.href !== new URL(href, window.location.origin).href) {
      link.href = href;
    }
  }, [editorTheme]);

  return (
    <ExtensiveEditor
      initialTheme="light"
      onThemeChange={setEditorTheme}
      toolbarAlignment="center"
    />
  );
}
```

Place these files in your app static assets:

- `/public/highlightjs/github.css`
- `/public/highlightjs/github-dark.css`

## Ref API

- `injectJSON(content: string): void`
- `getJSON(): string`

## Notes

This is the base preset that other presets build on.



