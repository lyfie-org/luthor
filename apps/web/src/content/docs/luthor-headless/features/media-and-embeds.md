---
title: Media and Embeds
description: Image, iframe, and YouTube embedding features.
---

# Media and Embeds

This group covers image, iframe, and YouTube workflows.

## Included extensions

- `imageExtension`
- `iframeEmbedExtension`
- `youTubeEmbedExtension`

## Key commands

- Image:
  - `insertImage`
  - `setImageAlignment`
  - `setImageCaption`
  - `getImageCaption`
- iframe:
  - `insertIframeEmbed`
  - `setIframeEmbedAlignment`
  - `resizeIframeEmbed`
  - `setIframeEmbedCaption`
  - `getIframeEmbedCaption`
  - `updateIframeEmbedUrl`
  - `getIframeEmbedUrl`
- YouTube:
  - `insertYouTubeEmbed`
  - `setYouTubeEmbedAlignment`
  - `resizeYouTubeEmbed`
  - `setYouTubeEmbedCaption`
  - `getYouTubeEmbedCaption`
  - `updateYouTubeEmbedUrl`
  - `getYouTubeEmbedUrl`

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
      <button onClick={() => commands.insertIframeEmbed?.('https://example.com')}>Iframe</button>
      <button onClick={() => commands.insertYouTubeEmbed?.('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}>YouTube</button>
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
