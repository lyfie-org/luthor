---
title: "Simple Editor"
description: "Chat-style preset with minimal formatting and send workflows."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "SimpleEditor"
  - "chat input"
  - "send button"
  - "submitOnEnter"
props:
  - "submitOnEnter"
  - "allowShiftEnter"
  - "onSend"
  - "outputFormat"
  - "featureFlags"
exports:
  - "SimpleEditor"
  - "simpleEditorPreset"
  - "SimpleEditorProps"
commands:
  - "format.bold"
  - "format.italic"
extensions:
  []
nodes:
  - "paragraph"
  - "text"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/simple-editor/SimpleEditor.tsx"
navGroup: "luthor"
navOrder: 80
---

# Simple Editor

This preset is optimized for chat/message composition.

## When to use this

Use `SimpleEditor` when you need compact input, send actions, and controlled output payloads.

## Mode profile

- Modes: `visual-only`, `visual`.

## Preset props

- `submitOnEnter`: Sends content on Enter key.
- `allowShiftEnter`: Keeps Shift+Enter as line break when `submitOnEnter` is enabled.
- `onSend`: Callback that receives markdown/json payload based on `outputFormat`.
- `outputFormat`: Chooses `md` or `json` as `payload.text`.
- `featureFlags`: Scoped overrides for SimpleEditor; currently supports `featureFlags.codeIntelligence`.

## Code intelligence toggle

~~~tsx
<SimpleEditor
  featureFlags={{ codeIntelligence: true }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { SimpleEditor } from '@lyfie/luthor';

export function App() {
  return (
    <SimpleEditor
      submitOnEnter
      outputFormat="md"
      onSend={(payload) => console.log(payload.markdown)}
    />
  );
}
~~~


