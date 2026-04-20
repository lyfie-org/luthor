---
title: "Extensive Editor"
description: "Full preset profile with all core features enabled and broad mode support."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "ExtensiveEditor"
  - "extensive preset"
  - "full editor"
  - "imageUploadHandler"
  - "gifUploadHandler"
props:
  - "featureFlags"
  - "availableModes"
  - "maxListIndentation"
  - "imageUploadHandler"
  - "gifUploadHandler"
exports:
  - "ExtensiveEditor"
  - "extensivePreset"
  - "createExtensivePreset"
commands:
  - "palette.show"
  - "insert.table"
  - "format.bold"
extensions:
  []
nodes:
  - "table"
  - "image"
  - "iframe-embed"
  - "youtube-embed"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/extensive/ExtensiveEditor.tsx"
  - "packages/luthor/src/presets/extensive/extensions.tsx"
navGroup: "luthor"
navOrder: 60
---

# Extensive Editor

This preset is the broadest out-of-box profile.

## When to use this

Use `ExtensiveEditor` when you want full formatting, media, code, and command workflows in one preset.

## Mode profile

- Default modes: `visual-editor`, `visual-only`, `json`, `markdown`, `html`.
- Default initial mode: `visual-editor`.

## Preset props

- `featureFlags`: Toggle individual preset capabilities. Use `featureFlags.codeIntelligence` to turn code intelligence on/off.
- `availableModes`: Restrict visible mode tabs and allowed mode switching targets.
- `maxListIndentation`: Caps nested list depth in visual editing.
- `imageUploadHandler`: Intercepts local image file uploads from the toolbar.
- `gifUploadHandler`: Intercepts local GIF uploads. Falls back to `imageUploadHandler` when omitted.

## Custom upload hooks

~~~tsx
<ExtensiveEditor
  imageUploadHandler={async (file) => uploadToCdn(file)}
  gifUploadHandler={async (file) => uploadGifToMediaStore(file)}
/>
~~~

If `gifUploadHandler` is not provided, GIF file uploads use `imageUploadHandler`.

For production handlers, return a persistent URL from your storage service. Returning `blob:` URLs from handlers is fine for quick prototypes, but dev StrictMode remount cycles can revoke blob URLs and cause temporary `ERR_FILE_NOT_FOUND` preview errors.

## Code intelligence toggle

~~~tsx
<ExtensiveEditor
  featureFlags={{ codeIntelligence: false }}
/>
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
~~~


