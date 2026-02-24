---
title: Headless Preset
description: Reference preset showing direct headless composition.
---

# Headless Preset

Small reference preset demonstrating direct headless composition.

## Usage

```tsx
import { HeadlessEditorPreset } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <HeadlessEditorPreset placeholder="Start writing..." />;
}
```

## Props

- `className`: `undefined (default) | string`
- `placeholder`: `'Start writing...' (default) | string`

## Behavior

Uses a minimal extension set (`richText`, `history`, `bold`, `italic`, `underline`, `list`) and a lightweight toolbar.

