---
title: Simple Text Input
description: Constrained message composer preset with send controls.
---

# Simple Text Input

`ComposerEditor` is a constrained message-composer preset.

It keeps formatting intentionally minimal and supports send workflows out of the box.

## Usage

```tsx
import { ComposerEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ComposerEditor
      placeholder="Type a message"
      submitOnEnter
      allowShiftEnter
      outputFormat="md"
      onSend={({ text }) => {
        console.log(text);
      }}
    />
  );
}
```

## Props

`ComposerEditorProps` is purpose-built for message input.

- `formattingOptions`: `ComposerFormattingOptions`
- `onSend`: `(payload: ComposerEditorSendPayload) => void`
- `outputFormat`: `'md' (default) | 'json'`
- `submitOnEnter`: `false (default) | true`
- `allowShiftEnter`: `true (default) | false`
- `showBottomToolbar`: `true (default) | false`
- `toolbarButtons`: `readonly ComposerToolbarButton[]`
- `sendButtonPlacement`: `'inside' (default) | 'right'`
- `minHeight` / `maxHeight` / `minWidth` / `maxWidth`

## Behavior

- Allows only bold, italic, and strikethrough formatting.
- Always runs visual mode only.
- Supports auto-grow until `maxHeight`, then internal scrolling.

