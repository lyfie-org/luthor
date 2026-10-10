---
title: "Papyra Editor"
description: "Markdown-native, frontmatter-agnostic, token-themed note canvas preset with Obsidian-style embeds and a host adapter seam."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "PapyraEditor"
  - "papyra preset"
  - "markdownSourceOfTruth"
  - "wikilink"
  - "file embed"
  - "transclusion"
  - "saved card"
  - "transcription callout"
  - "PapyraEditorAdapter"
props:
  - "adapter"
  - "colored"
  - "readOnly"
  - "variant"
  - "locked"
  - "toolbar"
  - "blockAnchors"
  - "onChange"
  - "onDesync"
  - "onOutlineChange"
  - "featureFlags"
  - "collaboration"
exports:
  - "PapyraEditor"
  - "papyraPreset"
  - "createPapyraPreset"
  - "PapyraEditorAdapter"
commands:
  - "block.heading1"
  - "list.check"
  - "insert.table"
  - "insert.image"
extensions:
  - "wikilink"
  - "file-embed"
  - "transclusion"
  - "block-anchor"
  - "saved-card"
  - "callout"
nodes:
  - "wikilink"
  - "fileEmbed"
  - "transclusion"
  - "blockAnchor"
  - "savedCard"
  - "callout"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/papyra/PapyraEditor.tsx"
  - "packages/luthor/src/presets/papyra/adapter.ts"
  - "packages/luthor/src/presets/papyra/embeds.ts"
  - "packages/luthor/src/presets/papyra-collab/index.ts"
navGroup: "luthor"
navOrder: 110
---

# Papyra Editor

`PapyraEditor` is a markdown-native note canvas composed on top of the extensive
preset. It is the editor the [Papyra](https://github.com/lyfie-org) note app
ships, but it is host-agnostic: every external capability (media, uploads, note
search and navigation, block resolution) flows through an injected adapter, so
any note app can reuse it by supplying different configuration.

## When to use this

Reach for `PapyraEditor` when your body of truth is a frontmatter-free markdown
file and you want a polished, restricted writing surface with Obsidian-style
embeds — `[[Note]]` wikilinks, `![[file.ext]]` media, `![[Note#^id]]`
transclusion, and trailing `^id` block anchors — that survives a lossless
round-trip back to that file.

## The four invariants

1. **Markdown is the source of truth.** `getMarkdown()` returns exactly what
   lands in the `.md` body (CommonMark plus the documented embed set). There is
   no JSON or HTML "real" format. The preset runs `sourceMetadataMode="none"`.
2. **The body is frontmatter-free.** The host splits YAML from the body and
   hands the editor only the body; the preset never renders, emits, or mangles
   frontmatter.
3. **The caret is sacred.** The editor is **uncontrolled** — it reads
   `defaultContent` once on mount and there is no `value` prop or controlled
   round-trip. The `onChange` callback is a **notification**, not a value
   binding: nothing you do in it re-renders the document. Adopt a remote
   revision by remounting (change the React `key`) or by calling `setMarkdown`
   imperatively, never with a live-DOM patch.
4. **Theming is token-driven.** All color and typography flow from
   `var(--papyra-*, fallback)` tokens. The preset bundles no fonts — the host
   loads Marcellus / Sora / Roboto Mono.

## Locked contract

`PapyraEditor` hard-locks the props it owns; callers cannot reach them:

- Modes are fixed to `['visual', 'markdown']` (no `json`/`html`).
- View tabs hidden. By default the only toolbar is floating-on-selection; the
  opt-in `toolbar` prop adds an always-visible toolbar, but it is never pinned.
- `markdownSourceOfTruth` is on and `sourceMetadataMode="none"`.
- `featureFlags` are routed through `papyraFeaturePolicy`, whose **enforced** set
  keeps markdown-breaking features off — font/size/line-height pickers, arbitrary
  text color and highlight, sub/superscript, the in-editor theme toggle, and
  draggable blocks **cannot be switched back on** by a caller flag.

## Preset props

- `adapter`: the host seam (`PapyraEditorAdapter`). Supplies media resolution,
  uploads, note search/navigation, and block resolution. Omit it and the preset
  uses a graceful no-op adapter so the editor still renders and round-trips.
- `colored`: light-locks a tinted ("colored") note so ink stays readable on the
  host-painted paper, regardless of the ambient app theme.
- `readOnly`: mounts a non-editable surface (`visual-only`, click-to-edit
  disabled) that emits no change events — safe for revision previews and
  time-machine scrubbing. Pair with repeated `setMarkdown` calls.
- `variant`: `"focus"` widens the body to a centered, distraction-free measure;
  `"default"` is the standard editorial measure.
- `toolbar`: opt into a persistent toolbar above the editor (default `false` —
  floating-on-selection only). It lists just Papyra's markdown-safe actions
  (headings/paragraph, quote, bold/italic/strikethrough/inline-code/link,
  lists + checklist, code block, horizontal rule, table, image); the restricted
  controls (typography pickers, color/highlight, sub/superscript, alignment, theme
  toggle) can never appear, and the toolbar is never pinned. After the built-ins
  come Papyra's own inserts: **Link a note** (types `[[`), **Mention someone**
  (types `@`, adding a space first after a word — only when the adapter has
  `searchUsers`), **Attach file** (uploads through the adapter and embeds
  `![[name]]` — only with an adapter), **Embed** (a menu: YouTube video or web
  page, each asking for the link in a themed dialog) and **Insert today's date**.
  The prop is live — toggling it shows or hides the toolbar without remounting
  the editor, so the caret and undo history survive. Only renders in the
  editable visual surface, so `readOnly`/`locked` never show it.
- `toolbarLayout`: the persistent toolbar's layout — order, sections, and which
  sections collapse behind one button (`group`). Defaults to
  `PAPYRA_TOOLBAR_LAYOUT`. Restricted items stay stripped by the visibility
  contract whatever the layout lists. Place host items with `"customComponent"`
  (all) or `"custom:<id>"` (one).
- `toolbarItems`: host controls for the toolbar, replacing the preset's own
  inserts (`createPapyraToolbarItems`) — so a host can use its own icons,
  grouping and behaviour. Items use `runCommand` to reach editor commands such as
  `uploadAndEmbedFile`, `insertImage`, `insertYouTubeEmbed` or `startMention`.
- `imageUploadHandler`: where the editor's own image paths (the toolbar image
  menu, `/image`) store a picked file; return the URL to use. Without it they
  fall back to a `blob:` URL, which does not survive a reload — set it.
- `locked`: withholds the body entirely — renders a blurred placeholder and
  **never mounts the editor**, so there is no plaintext in the DOM. The lock is
  UX only; the server (`401`/`PathGuard`) is the security boundary.
- `blockAnchors`: block-anchor assignment policy — `"off"` (default; anchors
  already in the text parse and round-trip, nothing creates one), `"on-demand"`
  (the host stamps at save time via `ensureBlockAnchors()`), or `"auto"` (every
  anchorable block — paragraph, heading, quote, and **list item** — gets a
  stable `^id` appended on commit; `- item ^abc12345` and `- [ ] task ^abc12345`
  are valid markdown and round-trip verbatim). Anchors are invisible in the visual surface: no `^id`
  artefact, no caret stop, nothing selectable — while the trailing ` ^id`
  round-trips losslessly in the markdown. An anchor is always kept **last** in
  its block, in every mode: the caret snaps in front of it, and text that lands
  behind it moves it back to the end. That is what keeps a block's id stable
  when you type at the end of an anchored line — an id is an address, and
  `![[Note#^id]]` references to it must not change under the writer.
- `onChange`: first-class change notification (see
  [Change notification and autosave](#change-notification-and-autosave)).
- `onDesync`: opt-in model/DOM divergence watchdog (see
  [The DOM is not the source of truth](#the-dom-is-not-the-source-of-truth)).
- `onOutlineChange`: fired (debounced) with the current document outline; drives
  a host's live table-of-contents scrollbar. Read-only observation — the caret
  is never touched.
- `typeahead`: host tuning for the `@` and `[[` triggers — how eagerly each
  opens, its caret offset, its copy, whether it is registered at all, and the
  shared search debounce. See
  [Tuning the typeahead](#tuning-the-typeahead).
- `featureFlags`: per-feature overrides, resolved through the enforced policy.
- `collaboration`: a memoized `CollaborationExtension` from
  `@lyfie/luthor-headless/collab` — live multi-cursor editing (see
  [Live collaboration](#live-collaboration)).

## Change notification and autosave

**Do not attach a DOM `onInput` handler to a wrapper element — it will never
fire.** Lexical stops propagation of the contenteditable's `input` event, so
React's delegated synthetic `onInput` on an ancestor receives nothing, and an
autosave driven that way silently saves nothing. Wire autosave to the editor's
own `onChange` instead:

~~~tsx
<PapyraEditor
  defaultContent={body}
  onChange={({ markdown, source, isDirty }) => {
    if (source !== 'user') return; // ignore your own setMarkdown adopts
    if (!isDirty) return;
    scheduleAutosave(markdown);    // your debounce; one call per commit arrives here
  }}
/>
~~~

The payload is `{ markdown, source, isDirty }`:

- Fires for **every mutation path** — typing, toolbar formatting, slash
  commands, undo/redo, paste, drag-drop, and markdown source-view edits — with
  `source: "user"`, coalesced to **one call per committed change** (typing a
  character produces exactly one call).
- The initial `defaultContent` load never fires. A host-initiated `setMarkdown`
  fires at most once with `source: "programmatic"` (only when it actually
  changes the content), so your autosave can ignore it.
- `isDirty` compares against the editor's own serialization of the mounted (or
  last adopted) content — see the normalisation contract below.

### Ready timing and the normalisation contract

`onReady` fires only after the editor is interactive **and** the initial
content has been injected and reconciled, so `getMarkdown()` called
synchronously inside the callback is already stable — no settle timers:

~~~tsx
onReady={(editor) => {
  baselineRef.current = editor.getMarkdown(); // safe: no setTimeout needed
}}
~~~

Note that `getMarkdown()` is **not** byte-identical to the markdown you loaded:
the editor re-normalises everything it imports (list markers, spacing, fence
style), so `getMarkdown(setMarkdown(x)) !== x` in general. Always baseline your
dirty checks against the editor's own output — the `onReady` snapshot or the
`markdown` field of an `onChange` payload — never against your input string.

## The DOM is not the source of truth

Serialization reads the Lexical model, never the DOM. Text written into the
contenteditable behind the reconciler's back — `document.execCommand`, browser
extensions, password managers, translation tools — can render on screen while
being absent from `getMarkdown()`. Two consequences:

- **Never assert against `innerText` in tests**; use `getMarkdown()`.
- **Never mutate the contenteditable directly**; go through `setMarkdown` or
  the command surface.

To be told instead of silently losing such writes, pass `onDesync`: an internal
observer compares the visible text with the model after external mutations
settle and reports `{ domText, modelText }` when they disagree.

## Keyboard access: escaping Tab capture

Tab indents (and Shift+Tab outdents) inside the editor, which would otherwise
trap keyboard-only users (WCAG 2.1.2). The standard escape is built in: press
**Escape, then Tab** — the armed Tab performs the browser's native focus move
out of the editor instead of indenting; any other key restores Tab-as-indent.
Advertise "Press Esc then Tab to move focus out of the editor" in your help UI.

## Imperative ref

`PapyraEditorRef` extends `ExtensiveEditorRef` with the markdown-first surface a
host drives: `setMarkdown(md)` (host-driven adopt), `focus()`, `getOutline()` /
`scrollToHeading(key)` for the table of contents, `getBlocks()` for block
anchors, `ensureBlockAnchors()` to stamp missing anchors and return the stamped
body (the `"on-demand"` save-time flow), and `getMentions()` for `@username`
detection. The host calls these during its own orchestration (autosave, remount,
TOC) — they never fire on keystrokes.

Each `getBlocks()` entry carries the anchor id plus the block's own `text`,
`line`, and `start`/`end` character offsets in the markdown body, so a host can
resolve a `#^id` reference without re-parsing the document.

## The host adapter

The adapter is the entire contract between the preset and the host. The editor
declares it; the host implements it.

~~~ts
interface PapyraEditorAdapter {
  // ![[file]] → URL. `variant: "thumb" | "poster"` asks for a smaller rendition
  // at least `width` px wide; return the original's URL if there is none.
  resolveMediaUrl(filename: string, options?: { variant?: "original" | "thumb" | "poster"; width?: number }): string;
  // Cached metadata (kind, size, width/height, version, thumb/poster/animated).
  // `undefined` while unknown (start a lookup); the same object until it changes.
  getMediaMeta?(filename: string): MediaMeta | null | undefined;
  subscribeMediaMeta?(listener: () => void): () => void;
  renderFileExpansion?(context: FileExpansionContext): ReactNode;  // e.g. a PDF viewer under a file card
  renderFileCard?(context: FileCardContext): ReactNode;             // your own look for a document (icon + name)
  resolveEmbed?(url: string): Promise<                               // a link toEmbeddableUrl doesn't know
    | { type: "iframe"; src: string; title?: string; width?: number; height?: number }
    | { type: "card"; url: string; title?: string }                  // a site that refuses framing
    | null>;
  // drop/paste/pick → store. Pass `signal` to fetch/XHR (Cancel) and report progress 0–1.
  uploadMedia(file: File, options?: { signal: AbortSignal; onProgress: (fraction: number) => void }): Promise<{ filename: string; label?: string }>;
  validateMedia?(file: File): string | null;                 // refuse before uploading (a message), or null
  onUploadError?(error: unknown, file: File): void;          // once per failure (a toast)
  mediaToolbarItems?(context: MediaToolbarContext): MediaToolbarItem[];  // host buttons on a selected attachment
  openNote(ref: { title?: string; id?: string }): void;      // [[Note]] → navigate
  searchNotes(q: string): Promise<Array<{ id: string; title: string; color?: string }>>;
  searchUsers?(q: string): Promise<Array<{ username: string; name: string }>>;
  resolveBlock?(ref: { note: string; blockId: string }): Promise<string | null>;
  resolveCard?(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    siteName?: string;
  } | null>;                                                 // ![[card:url]] → metadata
  onMentions?(usernames: string[]): void;
}
~~~

The adapter's resolvers are where the host's server-side authorization lives. The
editor's blur/lock is UX, never the boundary.

### Typeahead dropdowns

Two triggers open a caret-anchored dropdown, and both are fed by the adapter:

| Trigger | Menu       | Fed by                  | Inserts                    |
| ------- | ---------- | ----------------------- | -------------------------- |
| `[[`    | note links | `searchNotes(q)`        | a `[[Note]]` wikilink      |
| `@`     | mentions   | `searchUsers(q)`        | plain `@username ` text    |

Both are host-gated: with no adapter (or, for `@`, no `searchUsers`) the trigger
is silent and no menu renders, so the editor never offers a suggestion it cannot
honour. Keyboard-driven throughout — Escape closes, arrows move, Enter/Tab
select, and a click outside dismisses.

The `@` trigger matches the mention rule byte-for-byte: an `@` only opens the
menu at the start of a block or after whitespace, `(`, or `[`, and the query is
`[A-Za-z0-9][A-Za-z0-9._-]{0,63}`. `bea@example.com` never opens it. Mentions are
written as **plain text**, not a node — nothing to serialize, nothing that can
rewrite the body on save — and hosts detect them by scanning the markdown (see
`getMentions()`).

Both triggers open on the bare trigger by default (`minQueryLength: 0`), so
typing `@` or `[[` shows the host's first page immediately. Raise the floor per
trigger if an unfiltered list is noise — see
[Tuning the typeahead](#tuning-the-typeahead).

**Where they open.** Both triggers only open inside a block that can carry a
`^id` block anchor — paragraph, heading, quote, and list item. That is not a
style choice: a host resolves a mention to the anchor of the block it sits in,
so a mention typed anywhere else could never be delivered. The trigger
container set and the block-anchor stamping set are derived from one exported
source of truth (`ANCHORABLE_BLOCK_TYPES` in `@lyfie/luthor-headless`), so they
cannot drift apart. Code blocks and tables are excluded in both.

### Tuning the typeahead

The `typeahead` prop is the host's seam over both triggers. Every field is
optional and defaults to the shipped behaviour, so omitting it changes nothing.

~~~tsx
<PapyraEditor
  adapter={adapter}
  typeahead={{
    mention: {
      minQueryLength: 0,             // 0 (default) → a bare `@` opens the menu
      offset: { x: 0, y: 8 },        // menu offset from the caret
      title: 'Mention',              // menu heading
      emptyLabel: 'No matching users',
      disabled: false,               // true → trigger not registered at all
    },
    noteLink: {
      minQueryLength: 0,             // 0 (default) → `[[` opens the menu
      offset: { x: 0, y: 8 },
      title: 'Link note',
      emptyLabel: 'No matching notes',
      disabled: false,
    },
    searchDebounceMs: 120,           // shared by both triggers
  }}
/>
~~~

| Field                   | Default                | What it does                                                   |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| `minQueryLength`        | `0`                    | Characters required after the trigger before the menu opens.     |
| `offset`                | `{ x: 0, y: 8 }`       | Menu position relative to the caret.                             |
| `title`                 | `Mention` / `Link note`| Menu heading (localisation, product vocabulary).                 |
| `emptyLabel`            | see above              | Shown when the host's search returns nothing.                    |
| `disabled`              | `false`                | Unregisters the trigger — the character stays ordinary text.     |
| `searchDebounceMs`      | `120`                  | Debounce before a query reaches the adapter. Shared.             |

Only the **length floor** is configurable. The syntax rules are fixed at every
setting: a username's legal characters still close the `@` menu on the first
character it cannot accept, and `[[` still never opens after `!` or once the
link is closed or aliased.

`disabled` is the switch for a surface that has no people directory, or a
deployment that does not use note links — previously the only way to suppress a
trigger was not to mount the editor. It drops the trigger extension *and* the
matching suggestion provider; the embed nodes (wikilink rendering, media,
anchors) stay registered, so existing `[[Note]]` links in the body keep working.

Menu size is CSS, not a prop: override `--luthor-typeahead-menu-max-height` and
`--luthor-typeahead-menu-width` on your own scope.

## Usage

~~~tsx
import '@lyfie/luthor/styles.css';
import { PapyraEditor, type PapyraEditorRef } from '@lyfie/luthor';
import { useRef } from 'react';

export function NoteCanvas({ body }: { body: string }) {
  const ref = useRef<PapyraEditorRef>(null);

  return (
    <PapyraEditor
      ref={ref}
      defaultContent={body}
      adapter={{
        resolveMediaUrl: (name, { variant, width } = {}) =>
          variant === 'thumb' ? `/api/media/${name}/thumb?w=${width}` : `/api/media/${name}`,
        uploadMedia: async (file, { signal, onProgress } = {}) => {
          const stored = await upload(file, { signal, onProgress }); // Cancel + progress bar
          return { filename: stored.name };
        },
        openNote: ({ title }) => router.push(`/notes/${title}`),
        searchNotes: (q) => api.searchNotes(q),
        searchUsers: (q) => api.searchUsers(q),
      }}
      onReady={(editor) => {
        // Read the body imperatively — never a controlled value.
        console.log(editor.getMarkdown());
      }}
    />
  );
}
~~~

`PapyraEditor` is also available as a subpath export:

~~~ts
import { PapyraEditor } from '@lyfie/luthor/presets/papyra';
~~~

## Embeds and lossless round-trips

Every custom embed ships a bidirectional markdown transformer, so the body that
`getMarkdown()` returns is byte-stable across repeated saves:

| Markdown            | Renders as                          |
| ------------------- | ----------------------------------- |
| `![[diagram.png]]`  | picture at its natural size (via `resolveMediaUrl`)|
| `![[diagram.png\|480]]`, `\|480x320` | 480 px wide (and tall) — what resizing writes |
| `![[diagram.png\|Alt text\|480]]` | with alt text |
| `![[diagram.png]] <!-- align:center --> <!-- caption:… -->` | aligned / captioned (trailing directives) |
| `![[report.pdf#page=3]]` | file card (+ `renderFileExpansion`, e.g. a PDF at page 3) |
| `text ![[icon.png]] text` | inline attachment inside a paragraph |
| `![alt\|300](https://…)` | web image, 300 px wide |
| `[[Note]]`          | wikilink (click → `openNote`)       |
| `[[Note\|alias]]`   | aliased wikilink                    |
| `![[Note#^id]]`     | read-only transclusion              |
| `text ^id`          | trailing block anchor (non-rendering)|
| `![[card:url]]`     | saved web card (via `resolveCard`)  |
| `![[card:url\|title]]` | saved web card with author title |
| `![[card:url\|title\|480]]`, `![[card:url\|\|480]]` | a card 480 px wide (what resizing writes) |
| `![[card:url]] <!-- align:right --> <!-- caption:… -->` | aligned / captioned card |
| `![[youtube:url]]`  | YouTube player (optional `\|caption`)|
| `![[iframe:url]]`   | iframe embed (optional `\|caption`) |
| `> [!transcript]`   | transcription callout (display-only)|

The embed nodes and transformers live in `@lyfie/luthor-headless` and are
re-exported through `@lyfie/luthor` — the preset only composes and themes them.

The **transcription callout** is an Obsidian-style `> [!transcript]` block: an
opening line (optionally `> [!transcript] Title`) followed by `>`-prefixed body
lines, terminated by a blank line. It renders as an accent-tinted, labelled block
on the quote surface and is display-only — the transcript text lives inline in the
body, so it needs no resolver and round-trips verbatim (the marker is normalized
to lowercase).

The **saved web card** (`![[card:url]]`) renders an archived link card. When the
host wires `resolveCard`, the editor enriches it with the page's open-graph
metadata (title, description, preview image, favicon, site name); without a
resolver the card degrades to a titled link to the URL. As with every embed, only
the verbatim `url` (and optional `|title`) is serialized, so the metadata is
render-only and the markdown round-trips unchanged.

Since 2.11.9 a card is laid out like any other embed: click it to select it (in
an editable note it is no longer followed on click — the "↗ site" link in its
corner, or Ctrl/⌘-click, opens the page), then align it, caption it, move it or
remove it from the floating toolbar, and resize it by its edge. Its width is a
second `|` segment (`![[card:url|title|480]]`, or `![[card:url||480]]` with no
title — a lone `|480` stays a title, as it always was); alignment other than
centre and the caption are trailing directives. A card that fills the column
narrows to two thirds when aligned, so the alignment shows.

The **YouTube** (`![[youtube:url]]`) and **iframe** (`![[iframe:url]]`) embeds
reuse the shared media nodes from `@lyfie/luthor-headless` and carry an optional
`|caption` and size (`![[youtube:url|caption|640x360]]`). A YouTube
`watch`/`youtu.be`/`shorts` link is normalized to the canonical `…/embed/<id>`
player URL on the first pass and is byte-stable afterward; an iframe URL gains
`https://` if it has none.

### Attachments: size, alignment, captions

Sizes use Obsidian's pipe syntax, so a vault opens unchanged in both apps:
`|W` or `|WxH` as the last pipe segment, after an optional alt text. Alignment
and captions are trailing HTML comments on the same line
(`<!-- align:left|center|right -->`, `<!-- caption:… -->`); unknown directives
and pipe segments are kept verbatim. An embed nobody edited exports the exact
text it was read from — opening a note never rewrites it — and an edited one
writes only the fields it has. In a table, the pipe is escaped: `![[a.png\|200]]`.

Clicking an attachment selects it (one selection store per editor) and shows its
toolbar *inside* the picture: align, ¼ ½ ¾ Full, original size, caption, alt
text, open, the host's `mediaToolbarItems`, remove. Handles resize with
mouse, touch or pen (one undo step, one collaboration update, written on
release; Escape cancels); with the attachment selected, Shift+←/→ resizes by
10 px (Alt+Shift by 1), Enter starts a line after it, Escape deselects.

### Uploads

Dropped, pasted and picked files each get a placeholder at once — in order, at
the drop point or the caret — that shows progress and Cancel, and Retry/Remove if
it fails; three upload at a time. Placeholders export nothing and carry no
`blob:` URL, so a save mid-upload writes nothing for them and collaborators see
only "Uploading…". A paste from Word, Excel or Google Docs keeps its text rather
than uploading a picture of it. A drop with files dispatches a bubbling
`luthor:media-drop` event on the editor root (for a host's drop overlay).

### Host media wiring

Optional adapter members, each degrading when absent:

| Member | Without it | With it |
| --- | --- | --- |
| `getMediaMeta` + `subscribeMediaMeta` | frame measures itself on load | box reserved up front (no layout shift), file cards show size |
| `resolveMediaUrl` `variant` | originals everywhere | `thumb` at 320/640/1280 px, video `poster` |
| `renderFileExpansion` | plain file card | e.g. inline PDF under the card |
| `renderFileCard` | built-in file card | your own document look (icon + name) |
| `resolveEmbed` | links framed as given | short links followed, oEmbed players, link cards for sites that refuse framing |
| `validateMedia` / `onUploadError` | every file uploads, failures only on the placeholder | refuse early with a message, toast once per failure |
| `mediaToolbarItems` | built-in toolbar | host buttons (copy link, download, replace…) |

## Live collaboration

Pass `collaboration` and the shared Yjs document becomes the body:

~~~tsx
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationExtension } from '@lyfie/luthor-headless/collab';

const collaboration = useMemo(
  () => new CollaborationExtension({ id: room, providerFactory, username, cursorColor }),
  [room],
);

<LexicalCollaboration>
  <PapyraEditor key={room} adapter={adapter} collaboration={collaboration} />
</LexicalCollaboration>
~~~

- `defaultContent` is ignored; `setMarkdown` / `injectJSON` throw.
- Modes are `visual` only — the markdown source view would replace the whole
  document and drop concurrent peer edits.
- Undo reverts only this user's edits. Block anchors are never stamped
  client-side; the persisting server owns them.
- Omit `onChange`: the server persists the room.
- Media edits (resize, align, caption) are one update each; upload placeholders
  reach peers as "Uploading…" and never as a `blob:` URL.

The server half is `@lyfie/luthor/presets/papyra-collab` — Node-safe, no DOM:

~~~ts
import { createPapyraHeadlessCollab } from '@lyfie/luthor/presets/papyra-collab';

const note = createPapyraHeadlessCollab(ydoc);
if (note.isEmpty()) note.setMarkdown(bodyFromDisk); // seed a fresh room
note.ensureBlockAnchors();
await save(note.getMarkdown());                      // byte-identical to the browser getMarkdown()
note.dispose();
~~~

`getPapyraCollabNodes()` returns the exact node classes the browser registers,
so anything a client writes, the server can decode. Install `yjs` and
`@lexical/yjs` (optional peers) only when you use either half. Protocol details:
[Collaboration](/docs/luthor-headless/features/collaboration/).

## Command surface

The slash menu and command palette are curated down to note-taking primitives:
headings (H1–H3), lists and checklist, quote, code block, table, horizontal
rule, and image — plus **Embed a link** and **YouTube video** when the host
turns those embeds on (`features: { iframeEmbed: true, youTubeEmbed: true }`).
The typography pickers, view tabs, and pinned toolbar are enforced off.

The menu (like every caret menu) stays inside what can be seen: in a note that
scrolls inside a panel it opens above the caret near the panel's foot, never
over the line being typed, and its list scrolls when it is taller than the room.

On top of the curated built-ins, PapyraEditor contributes three note-specific
slash commands through the editor's `extraSlashCommands` seam:

| Command       | Inserts                                                        |
| ------------- | ------------------------------------------------------------- |
| `Link note`   | the `[[` trigger, which opens the wikilink typeahead          |
| `Embed media` | a picked file → the upload pipeline (placeholder, progress) → `![[filename]]` |
| `Insert date` | today's date as `YYYY-MM-DD`                                  |

Each writes markdown-native syntax at the caret, so the body stays the source of
truth and round-trips unchanged. The commands are appended automatically — there
is nothing to wire beyond supplying an `adapter` for `Embed media` to upload
through.
