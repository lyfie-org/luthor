---
title: Email Compose
description: Usage and prop defaults for the email compose preset.
---

# Email Compose

Email composer preset with To/Cc/Bcc/Subject shell.

## Usage

```tsx
import { EmailComposeEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <EmailComposeEditor showCc showBcc />;
}
```

## Props

`EmailComposeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.

- `showTo`: `true (default) | false`
- `showCc`: `false (default) | true`
- `showBcc`: `false (default) | true`
- `showSubject`: `true (default) | false`

## Behavior

Preset applies email-friendly feature defaults and renders compose header fields.

