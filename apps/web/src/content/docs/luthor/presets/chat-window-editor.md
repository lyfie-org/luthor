---
title: Chat Window
description: Usage and prop defaults for the chat-style editor preset.
---

# Chat Window

Chat composer style preset with send and action controls.

## Usage

```tsx
import { ChatWindowEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ChatWindowEditor
      onSend={({ jsonb }) => console.log(jsonb)}
      submitOnEnter
      allowShiftEnter
    />
  );
}
```

## Props

`ChatWindowEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`.

- `onSend`: `undefined (default) | (payload: { jsonb: string }) => void`
- `submitOnEnter`: `true (default) | false`
- `allowShiftEnter`: `true (default) | false`
- `showVoiceButton`: `false (default) | true`
- `showImageButton`: `true (default) | false`
- `showSendButton`: `true (default) | false`

## Behavior

- Toolbar is disabled by preset defaults
- Visual mode only
- Enter-to-send behavior is configurable

