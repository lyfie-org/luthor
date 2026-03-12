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

`SimpleEditorProps` is purpose-built for message input:

- `formattingOptions`: `SimpleFormattingOptions` (`bold`, `italic`, `strikethrough`)
- `onSend`: `(payload: SimpleEditorSendPayload) => void`
- `outputFormat`: `'md' (default) | 'json'`
- `clearOnSend`: `true (default) | false`
- `allowEmptySend`: `false (default) | true`
- `submitOnEnter`: `false (default) | true`
- `allowShiftEnter`: `true (default) | false`
- `showSendButton`: `true (default) | false`
- `sendButtonPlacement`: `'inside' (default) | 'right'`
- `sendButtonContent`: `ReactNode` (default `'Send'`)
- `sendButtonAriaLabel`: `string` (default `'Send message'`)
- `sendButtonClassName`: `string`
- `showBottomToolbar`: `true (default) | false`
- `toolbarButtons`: `readonly SimpleToolbarButton[]`
- `toolbarClassName`: `string`
- `toolbarStyle`: `CSSProperties`
- `scrollAreaClassName`: `string`
- `minHeight` / `maxHeight` / `minWidth` / `maxWidth`

## Behavior

- Allows only bold, italic, and strikethrough formatting.
- Always runs visual mode only.
- Uses custom shortcut defaults for chat-style typing.
- Supports auto-grow until `maxHeight`, then internal scrolling.
- Supports click-to-place-caret in the nearest line of text.

## `SimpleEditorSendPayload`

`onSend` receives:

- `format`: `'md' | 'json'`
- `text`: output text in the selected `outputFormat`
- `markdown`: markdown representation of current content
- `json`: JSON representation of current content

## Example: right-side send button

```tsx
<SimpleEditor
  sendButtonPlacement="right"
  submitOnEnter
  onSend={({ markdown }) => {
    console.log(markdown);
  }}
/>
```

