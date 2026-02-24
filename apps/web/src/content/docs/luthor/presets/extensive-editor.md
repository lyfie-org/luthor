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
- `showDefaultContent`: `true (default) | false`
- `placeholder`: `'Write anything...' (default) | string | { visual?: string; jsonb?: string }`
- `initialMode`: `'visual' (default) | 'jsonb'`
- `availableModes`: `['visual', 'jsonb'] (default) | ('visual' | 'jsonb')[]`
- `toolbarPosition`: `'top' (default) | 'bottom'`
- `toolbarAlignment`: `'left' (default) | 'center' | 'right'`
- `isToolbarEnabled`: `true (default) | false`
- `minimumDefaultLineHeight`: `1.5 (default) | string | number`
- `scaleByRatio`: `false (default) | true`
- `syncHeadingOptionsWithCommands`: `true (default) | false`
- `commandPaletteShortcutOnly`: `false (default) | true`
- `isCopyAllowed`: `true (default) | false`
- `syntaxHighlighting`: `'auto' | 'disabled'` | extension default behavior if omitted

## Ref API

- `injectJSONB(content: string): void`
- `getJSONB(): string`

## Notes

This is the base preset that other presets build on.

