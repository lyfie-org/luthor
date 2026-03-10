---
title: Simple Editor
description: Constrained message editor preset with send controls.
---

# Simple Editor

`SimpleEditor` is a constrained message-editor preset.

It keeps formatting intentionally minimal and supports send workflows out of the box.

## Usage

```tsx
import { SimpleEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <SimpleEditor
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

`SimpleEditorProps` is purpose-built for message input.

- `formattingOptions`: `SimpleFormattingOptions`
- `onSend`: `(payload: SimpleEditorSendPayload) => void`
- `outputFormat`: `'md' (default) | 'json'`
- `submitOnEnter`: `false (default) | true`
- `allowShiftEnter`: `true (default) | false`
- `showBottomToolbar`: `true (default) | false`
- `toolbarButtons`: `readonly SimpleToolbarButton[]`
- `sendButtonPlacement`: `'inside' (default) | 'right'`
- `minHeight` / `maxHeight` / `minWidth` / `maxWidth`

## Behavior

- Allows only bold, italic, and strikethrough formatting.
- Always runs visual mode only.
- Supports auto-grow until `maxHeight`, then internal scrolling.

