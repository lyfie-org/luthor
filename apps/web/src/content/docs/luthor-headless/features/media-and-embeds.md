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
  - "toEmbeddableUrl"
  - "formatFrameDirectives"
  - "parseFrameDirectives"
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
  - "packages/headless/src/extensions/media/embedProviders.ts"
  - "packages/headless/src/core/markdown.ts"
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
| `imageExtension` | `image` | `![alt](url)`, `![alt\|300](url)`, `… <!-- align:right -->` |
| `youTubeEmbedExtension` | `youtube-embed` | `![[youtube:url\|caption\|640x360]] <!-- align:right -->` |
| `iframeEmbedExtension` | `iframe-embed` | `![[iframe:url\|caption\|800x600]] <!-- align:left -->` |
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
| `![[iframe:url]] <!-- align:right -->` | web/YouTube embeds take the same directives; centre is their default and isn't written |
| `![](url) <!-- align:right -->` | a picture from a link: the same directive (with `imageAlignment: "comment"`) |

### Aligned pictures from links on a metadata-free export

`jsonToMarkdown(doc, { metadataMode: "none" })` writes an aligned `![](url)` as GitHub's
`<p align="…">` wrapper by default (so GitHub renders it aligned). Pass
`imageAlignment: "comment"` to keep the `<!-- align:… -->` directive instead — the
Papyra preset does. Both read back. HTML alignment wrappers become internal markers
during import that no transformer can claim (older `[[LUTHORALIGNSTART:…]]` lines,
which a `[[wikilink]]` transformer used to swallow, are recognised and healed). A
picture that ended up inside a paragraph is lifted out on export rather than dropped.

Guarantees:

- **Byte-stable.** An embed nobody edited exports the exact text it was read from; an edited one writes only the fields it has.
- **Lossless.** Unknown pipe segments and directives are kept verbatim; inside a markdown table the escaped form `![[a.png\|200]]` is read and written as-is.
- Sizes clamp to `MEDIA_MAX_DIMENSION` (16384). YouTube `watch`/`youtu.be`/`shorts` links normalize once to `…/embed/<id>`.

Parse/format helpers for hosts: `parseEmbedTarget`, `formatEmbedTarget`, `parseMediaDirectives`, `formatMediaDirectives`, `formatFrameDirectives`, `parseFrameDirectives`, `splitCaptionAndSize`, `classifyMedia`.

## Embedding any link

`insertIframeEmbed(url)` takes the link people actually have. `toEmbeddableUrl(url)`
(pure, no network, no API keys) turns well-known services into their embeddable form
and player shape: Google Maps (place, search, `@lat,lng`, directions, `?q=`), Apple Maps
share links (shown on the keyless Google embed), OpenStreetMap (a pin with no zoom of its
own opens at street level, `z=15`, since 2.11.8), YouTube, Vimeo, Spotify,
SoundCloud, Loom, Figma, CodePen, CodeSandbox, Google Docs/Sheets/Slides/Forms/Drive,
Dailymotion, Twitch, TikTok, Instagram, X, Miro and Canva. Anything else goes to the
host, if it configured one:

~~~ts
new IframeEmbedExtension({
  // After the embed is inserted (it shows a loading frame meanwhile).
  resolveUrl: async (url) => {
    const found = await myServer.resolve(url); // follow short links, oEmbed, X-Frame-Options…
    if (!found) return null;                   // keep the link as given
    return found.frameable
      ? { kind: "iframe", src: found.src, title: found.title }
      : { kind: "replace", createNode: () => $createSavedCardNode(url, found.title) };
  },
});
~~~

Embedded pages are sandboxed (`allow-scripts allow-same-origin allow-popups allow-forms
allow-presentation`): an embed can never navigate the note away.

## Select, resize, toolbar

All media nodes:

- **Click** selects (one selection store per editor, `registerClickToSelect` / `useIsNodeSelected`).
- **Handles** (images, attachments) resize with mouse, touch, or pen (`usePointerResize`): live preview, one undo step and one collaboration update on release; Escape cancels.

`![[file]]` attachments draw through `MediaFrame`, which adds:

- **Toolbar** inside the frame: align, ¼ ½ ¾ Full, original size, caption, alt text, open, host items, remove. Caption/alt prompts use the editor's themed dialog (`EditorPromptProvider`), never `window.prompt`; host items get the same dialog as `context.requestInput`, and can be plain text (`variant: "label"`, e.g. a file's size).
- **Loading**: a picture or video shows a shimmer (and a thin progress line) in its reserved box until it draws; a file just uploaded shows its local preview meanwhile. Pictures from links and web/YouTube embeds do the same, and a picture that can't load shows a card with Retry.
- **The floating toolbar** (web/YouTube embeds, pictures from links) is measured against what is actually visible — the window and every scrolling ancestor — so in a note that scrolls inside a panel it flips sides or pins inside the view instead of being cut off.
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
| `renderFileCard` | the host's own look for a document (e.g. a desktop-style icon and name); not resized |
| `mediaToolbar.items` / `builtIn: false` | add host buttons / drop the built-ins |

## Upload pipeline

~~~ts
new FileDropUploadExtension({
  uploadFile: (file, { signal, onProgress }) => upload(file, { signal, onProgress }), // → { filename, label? }
  validateFile: (file) => (file.size > 50e6 ? "Too large" : null),
  onUploadError: (error, file) => toast(`${file.name} failed`),
  concurrency: 3, // default
});
~~~

- Drop, paste, and pick each insert a placeholder at once — in order, at the drop point or caret — with progress, Cancel, and Retry/Remove on failure.
- Placeholders export nothing and hold no `blob:` URL: a mid-upload save writes nothing, collaborators see "Uploading…". One left by a closed tab reads as interrupted after `UPLOAD_STALE_AFTER_MS` (15 min).
- Rich pastes (Word, Excel, Sheets, web pages) keep their text instead of uploading a picture of it (`isRichTextPaste`).
- Returned filenames pass `sanitizeEmbedTarget` before `![[…]]` is written. A returned `label` (e.g. the original name of a document stored under a suffixed one) becomes the embed's alias: `![[q3-411e00.pdf|q3.pdf]]`.
- At 100% the placeholder says "Finishing up…" while the host stores the file; a picture's placeholder shows the picture itself, dimmed, under its progress bar.
- A drop with files dispatches bubbling `MEDIA_DROP_EVENT` (`luthor:media-drop`) on the editor root, for a host drop overlay.
- Commands: `uploadAndEmbedFile(file)`, `uploadAndEmbedFiles(files)` — the same pipeline for a host's own attach button.

## Related

- [URL and content safety](/docs/luthor-headless/url-and-content-safety/)
- [Papyra Editor](/docs/luthor/presets/papyra-editor/) — the preset wiring all of this to a host adapter
