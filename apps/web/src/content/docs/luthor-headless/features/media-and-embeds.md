---
title: Media and Embeds
description: Image, iframe, and YouTube embedding features.
---

# Media and Embeds

This group covers rich media insertion.

## Included extensions

- `imageExtension`
- `iframeEmbedExtension`
- `youTubeEmbedExtension`

## Example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  imageExtension,
  iframeEmbedExtension,
  youTubeEmbedExtension,
} from '@lyfie/luthor-headless';

const extensions = [
  richTextExtension,
  imageExtension,
  iframeEmbedExtension,
  youTubeEmbedExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands } = useEditor();
  return (
    <div>
      <button onClick={() => commands.insertImage?.({ src: '/demo/image.png', alt: 'Demo' })}>Image</button>
      <button onClick={() => commands.insertIframe?.({ src: 'https://example.com' })}>Iframe</button>
      <button onClick={() => commands.insertYouTube?.('dQw4w9WgXcQ')}>YouTube</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Add media..." />
    </Provider>
  );
}
```
