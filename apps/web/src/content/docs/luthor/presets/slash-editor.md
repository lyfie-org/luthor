---
title: Slash Editor
description: Slash-first preset with draggable and command-focused defaults.
---

# Slash Editor

`SlashEditor` is a slash-first preset tuned for command-driven writing.

## Usage

```tsx
import { SlashEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <SlashEditor showDefaultContent={false} />;
}
```

## Props

`SlashEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`, then re-adds both.

- `slashVisibility`: `undefined (default) | SlashCommandVisibility`
- `isDraggableEnabled`: `true (default) | false`
- `featureFlags`: `undefined (default) | FeatureFlagOverrides`
- `isToolbarEnabled`: `false (default) | true`

## Behavior

Defaults keep toolbar hidden, enable draggable blocks, and provide a curated slash-command allowlist for fast block creation.

## Default modes

- `availableModes`: `["visual", "json", "markdown", "html"]`

## Default slash allowlist

- `format.bold`, `format.italic`, `format.underline`, `format.strikethrough`, `format.code`
- `block.paragraph`, `block.heading1` to `block.heading6`, `block.quote`, `block.codeblock`
- `list.bullet`, `list.numbered`, `list.check`
- `link.insert`, `insert.horizontal-rule`, `insert.table`

## Feature policy notes

- Enforced: `slashCommand: true`, `commandPalette: false`
- Default: `isToolbarEnabled = false`
- Override available through props if your product needs a visible toolbar

