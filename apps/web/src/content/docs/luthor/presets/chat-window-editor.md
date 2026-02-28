---
title: Chat Window
description: Complete usage, prop options, and behavior reference for the chat input preset.
---

# Chat Window

`ChatWindowEditor` is a constrained chat-composer preset built for message input UX.

It is intentionally locked down to a small formatting set and single visual mode.

## Allowed formatting only

The chat preset only supports these text features:

- Bold
- Italic
- Strikethrough

Everything else is disabled in this preset:

- No underline
- No lists
- No links
- No images
- No tables
- No inline code
- No code blocks
- No embeds
- No command palette/slash menu/context menu
- No theme-toggle/history features in-editor

## Keyboard shortcuts

Allowed shortcuts:

- Bold: `Ctrl/Cmd + B`
- Italic: `Ctrl/Cmd + I`
- Strikethrough: `Ctrl/Cmd + Shift + X`

No other chat formatting shortcuts should be relied on.

## Usage

```tsx
import { ChatWindowEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ChatWindowEditor
      placeholder="Type a message"
      formattingOptions={{
        bold: true,
        italic: true,
        strikethrough: true,
      }}
      minHeight={56}
      maxHeight={220}
      minWidth={260}
      maxWidth={520}
      submitOnEnter={false}
      showBottomToolbar
      toolbarButtons={[
        { id: 'attachment', content: 'Attach', ariaLabel: 'Attach file', onClick: () => {} },
        { id: 'image', content: 'Image', ariaLabel: 'Add image', onClick: () => {} },
      ]}
      sendButtonPlacement="inside"
      outputFormat="md"
      onSend={({ format, text, markdown, json }) => {
        // `text` follows `outputFormat`
        console.log({ format, text, markdown, json });
      }}
    />
  );
}
```

## Prop Reference

`ChatWindowEditorProps` is purpose-built for chat and does not expose the full `ExtensiveEditorProps` surface.

### Core editor props

- `className`: `undefined (default) | string`
- `variantClassName`: `undefined (default) | string`
- `initialTheme`: `'light' (default) | 'dark'`
- `onThemeChange`: `undefined (default) | (theme: 'light' | 'dark') => void`
- `theme`: `undefined (default) | Partial<LuthorTheme>`
- `defaultContent`: `undefined (default) | string`
- `showDefaultContent`: `false (default) | true`
- `placeholder`: `undefined (default) | ExtensiveEditorProps['placeholder']`

### Formatting control

- `formattingOptions`: `undefined (default) | ChatWindowFormattingOptions`

`ChatWindowFormattingOptions`:

- `bold`: `true (default) | false`
- `italic`: `true (default) | false`
- `strikethrough`: `true (default) | false`

### Send/output behavior

- `onSend`: `undefined (default) | (payload: ChatWindowEditorSendPayload) => void`
- `outputFormat`: `'md' (default) | 'json'`
- `clearOnSend`: `true (default) | false`
- `allowEmptySend`: `false (default) | true`
- `submitOnEnter`: `false (default) | true`
- `allowShiftEnter`: `true (default) | false`

### Composer size/layout

- `minHeight`: `56 (default) | number | string`
- `maxHeight`: `220 (default) | number | string`
- `minWidth`: `240 (default) | number | string`
- `maxWidth`: `'100%' (default) | number | string`

### Bottom toolbar props

- `showBottomToolbar`: `true (default) | false`
- `toolbarButtons`: `[] (default) | readonly ChatWindowToolbarButton[]`
- `toolbarClassName`: `undefined (default) | string`
- `toolbarStyle`: `undefined (default) | React.CSSProperties`

### Send button props

- `showSendButton`: `true (default) | false`
- `sendButtonPlacement`: `'inside' (default) | 'right'`
- `sendButtonContent`: `'Send' (default) | ReactNode`
- `sendButtonAriaLabel`: `'Send message' (default) | string`
- `sendButtonClassName`: `undefined (default) | string`

### Scroll area styling

- `scrollAreaClassName`: `undefined (default) | string`

### Types

```ts
type ChatWindowOutputFormat = 'md' | 'json';

type ChatWindowEditorSendPayload = {
  format: ChatWindowOutputFormat;
  // Mirrors outputFormat ('md' -> markdown, 'json' -> json)
  text: string;
  // Always included
  markdown: string;
  // Always included
  json: string;
};

type ChatWindowFormattingOptions = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
};

type ChatWindowToolbarButton = {
  id: string;
  content: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
};
```

## Detailed behavior

### Output format behavior

- If `outputFormat="md"`, then `payload.text === payload.markdown`.
- If `outputFormat="json"`, then `payload.text === payload.json`.
- `payload.markdown` and `payload.json` are always provided for consumers that need both.

### Enter behavior

- `submitOnEnter=false` (default): Enter inserts newline.
- `submitOnEnter=true`: Enter sends via `onSend`.
- `allowShiftEnter=true`: Shift+Enter keeps newline behavior even if submit-on-enter is on.

### Auto-grow behavior

- Height grows from `minHeight` as content increases.
- At `maxHeight`, growth stops and internal composer scrolling is used.

### Cursor behavior

- Clicking in the non-interactive area of the editor shell focuses the editor and places caret near the first line.

### Visual mode only

- Chat preset always runs single visual mode.
- Visual/JSON tabs are not shown.

## Behavior

- Use this preset when you need a constrained chat input, not a general rich document editor.
- Use `formattingOptions` to selectively turn off any of the three allowed formatting features.
- Keep your product logic on `onSend` and treat `text` as the canonical value based on `outputFormat`.


