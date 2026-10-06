---
title: "Media and Embeds"
description: "Image, iframe, YouTube and file-embed extensions: sized markdown grammar, select/resize/toolbar frames, host media resolvers, and the upload pipeline."
package: "headless"
docType: "reference"
surface: "extension"
keywords:
  - "imageExtension"
  - "iframeEmbedExtension"
  - "youTubeEmbedExtension"
  - "fileEmbedExtension"
  - "FileDropUploadExtension"
  - "MediaFrame"
  - "EmbedResolverProvider"
  - "resize"
  - "upload"
  - "media grammar"
props:
  []
exports:
  - "imageExtension"
  - "iframeEmbedExtension"
  - "youTubeEmbedExtension"
  - "fileEmbedExtension"
  - "FileDropUploadExtension"
  - "UploadPlaceholderNode"
  - "MediaFrame"
  - "EmbedResolverProvider"
  - "EditorPromptProvider"
  - "parseEmbedTarget"
  - "formatEmbedTarget"
  - "parseMediaDirectives"
  - "formatMediaDirectives"
  - "classifyMedia"
  - "usePointerResize"
  - "useIsNodeSelected"
  - "sanitizeEmbedTarget"
  - "MEDIA_DROP_EVENT"
commands:
  - "insert.image"
  - "insert.iframe"
  - "insert.youtube"
extensions:
  - "imageExtension"
  - "iframeEmbedExtension"
  - "youTubeEmbedExtension"
  - "fileEmbedExtension"
  - "fileDropUploadExtension"
nodes:
  - "image"
  - "iframe-embed"
  - "youtube-embed"
  - "fileEmbed"
  - "uploadPlaceholder"
frameworks:
  []
lastVerifiedFrom:
  - "packages/headless/src/extensions/media/index.ts"
  - "packages/headless/src/extensions/media/mediaGrammar.ts"
  - "packages/headless/src/extensions/media/MediaFrame.tsx"
  - "packages/headless/src/extensions/embeds/EmbedResolverContext.tsx"
  - "packages/headless/src/extensions/embeds/FileDropUploadExtension.tsx"
navGroup: "luthor_headless"
navOrder: 80
---

# Media and Embeds

This group covers media insertion, attachment embeds, resizing, and uploads.

## What this page answers

- Which extensions support images, embeds, and attachments?
- How are size, alignment, and captions written to markdown?
- How does a host plug in media URLs, metadata, toolbar buttons, and uploads?

## Extension set

| Extension | Node | Markdown |
| --- | --- | --- |
| `imageExtension` | `image` | `![alt](url)`, `![alt\|300](url)` |
| `youTubeEmbedExtension` | `youtube-embed` | `![[youtube:url\|caption\|640x360]]` |
| `iframeEmbedExtension` | `iframe-embed` | `![[iframe:url\|caption]]` |
| `fileEmbedExtension` | `fileEmbed` | `![[file.ext]]` (block or inline) |
| `FileDropUploadExtension` | `uploadPlaceholder` | none — exports nothing |

## Sized media grammar

Obsidian-compatible, so a vault opens unchanged in both apps.

| Markdown | Result |
| --- | --- |
| `![[photo.png]]` | natural size, capped to the column |
| `![[photo.png\|480]]` / `\|480x320` | 480 px wide (and tall) |
| `![[photo.png\|Alt text\|480]]` | alt text + size; size is always the last pipe segment |
| `![[photo.png]] <!-- align:center --> <!-- caption:… -->` | trailing directives: `align:left\|center\|right`, `caption:` |
| `![[report.pdf#page=3]]` | file card; fragment passed to the host |
| `text ![[icon.png]] text` | inline attachment |

Guarantees:

- **Byte-stable.** An embed nobody edited exports the exact text it was read from; an edited one writes only the fields it has.
- **Lossless.** Unknown pipe segments and directives are kept verbatim; inside a markdown table the escaped form `![[a.png\|200]]` is read and written as-is.
- Sizes clamp to `MEDIA_MAX_DIMENSION` (16384). YouTube `watch`/`youtu.be`/`shorts` links normalize once to `…/embed/<id>`.

Parse/format helpers for hosts: `parseEmbedTarget`, `formatEmbedTarget`, `parseMediaDirectives`, `formatMediaDirectives`, `splitCaptionAndSize`, `classifyMedia`.

## Select, resize, toolbar

All media nodes:

- **Click** selects (one selection store per editor, `registerClickToSelect` / `useIsNodeSelected`).
- **Handles** (images, attachments) resize with mouse, touch, or pen (`usePointerResize`): live preview, one undo step and one collaboration update on release; Escape cancels.

`![[file]]` attachments draw through `MediaFrame`, which adds:

- **Toolbar** inside the frame: align, ¼ ½ ¾ Full, original size, caption, alt text, open, host items, remove. Caption/alt prompts use the editor's themed dialog (`EditorPromptProvider`), never `window.prompt`.
- **Keyboard** (selected): Shift+←/→ resizes 10 px (Alt+Shift 1 px), Enter adds a line after, Escape deselects.
- **Stable layout**: box reserved from host metadata (no layout shift); thumbnails at 320/640/1280 px; animated images never swapped for a still; a broken file shows a labelled error.

## Host resolvers

Wrap the editor in `EmbedResolverProvider`. Every member is optional; absent ones degrade (file → reference chip, still round-trips).

~~~tsx
<EmbedResolverProvider
  resolvers={{
    resolveMediaUrl: (name, { variant, width } = {}) =>
      variant === "thumb" ? `/media/${name}/thumb?w=${width}` : `/media/${name}`,
    getMediaMeta: (name) => metaCache.get(name), // undefined while unknown; same object until it changes
    subscribeMediaMeta: (listener) => metaCache.subscribe(listener),
    renderFileExpansion: ({ kind, url }) => (kind === "pdf" ? <PdfViewer src={url} /> : null),
    mediaToolbar: {
      items: ({ target }) => [{ id: "download", label: "Download", onSelect: () => download(target) }],
    },
  }}
>
  {editor}
</EmbedResolverProvider>
~~~

| Resolver | Purpose |
| --- | --- |
| `resolveMediaUrl(target, { variant, width })` | URL for `original`, `thumb`, or video `poster` |
| `getMediaMeta` + `subscribeMediaMeta` | size, dimensions, `animated`, `thumb`/`poster` flags (`MediaMeta`) |
| `renderFileExpansion` | extra content under a file card (e.g. inline PDF) |
| `mediaToolbar.items` / `builtIn: false` | add host buttons / drop the built-ins |

## Upload pipeline

~~~ts
new FileDropUploadExtension({
  uploadFile: (file, { signal, onProgress }) => upload(file, { signal, onProgress }), // → { filename }
  validateFile: (file) => (file.size > 50e6 ? "Too large" : null),
  onUploadError: (error, file) => toast(`${file.name} failed`),
  concurrency: 3, // default
});
~~~

- Drop, paste, and pick each insert a placeholder at once — in order, at the drop point or caret — with progress, Cancel, and Retry/Remove on failure.
- Placeholders export nothing and hold no `blob:` URL: a mid-upload save writes nothing, collaborators see "Uploading…". One left by a closed tab reads as interrupted after `UPLOAD_STALE_AFTER_MS` (15 min).
- Rich pastes (Word, Excel, Sheets, web pages) keep their text instead of uploading a picture of it (`isRichTextPaste`).
- Returned filenames pass `sanitizeEmbedTarget` before `![[…]]` is written.
- A drop with files dispatches bubbling `MEDIA_DROP_EVENT` (`luthor:media-drop`) on the editor root, for a host drop overlay.
- Commands: `uploadAndEmbedFile(file)`, `uploadAndEmbedFiles(files)` — the same pipeline for a host's own attach button.

## Related

- [URL and content safety](/docs/luthor-headless/url-and-content-safety/)
- [Papyra Editor](/docs/luthor/presets/papyra-editor/) — the preset wiring all of this to a host adapter
