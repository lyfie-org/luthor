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
  (history, headings/paragraph, quote, bold/italic/strikethrough/inline-code/link,
  lists + checklist, code block, horizontal rule, table, image); the restricted
  controls (typography pickers, color/highlight, sub/superscript, alignment, theme
  toggle) can never appear, and the toolbar is never pinned. Only renders in the
  editable visual surface, so `readOnly`/`locked` never show it.
- `locked`: withholds the body entirely — renders a blurred placeholder and
  **never mounts the editor**, so there is no plaintext in the DOM. The lock is
  UX only; the server (`401`/`PathGuard`) is the security boundary.
- `blockAnchors`: block-anchor assignment policy — `"off"` (default; anchors
  already in the text parse and round-trip, nothing creates one), `"on-demand"`
  (the host stamps at save time via `ensureBlockAnchors()`), or `"auto"` (every
  eligible top-level block — paragraph, heading, quote — gets a stable `^id`
  appended on commit). Anchors are invisible in the visual surface: no `^id`
  artefact, no caret stop, nothing selectable — while the trailing ` ^id`
  round-trips losslessly in the markdown.
- `onChange`: first-class change notification (see
  [Change notification and autosave](#change-notification-and-autosave)).
- `onDesync`: opt-in model/DOM divergence watchdog (see
  [The DOM is not the source of truth](#the-dom-is-not-the-source-of-truth)).
- `onOutlineChange`: fired (debounced) with the current document outline; drives
  a host's live table-of-contents scrollbar. Read-only observation — the caret
  is never touched.
- `featureFlags`: per-feature overrides, resolved through the enforced policy.

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
  resolveMediaUrl(filename: string): string;                 // ![[file]] → URL
  uploadMedia(file: File): Promise<{ filename: string }>;    // drop/paste → store
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
        resolveMediaUrl: (name) => `/api/media/${name}`,
        uploadMedia: async (file) => {
          const stored = await upload(file);
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
| `![[diagram.png]]`  | inline image (via `resolveMediaUrl`)|
| `[[Note]]`          | wikilink (click → `openNote`)       |
| `[[Note\|alias]]`   | aliased wikilink                    |
| `![[Note#^id]]`     | read-only transclusion              |
| `text ^id`          | trailing block anchor (non-rendering)|
| `![[card:url]]`     | saved web card (via `resolveCard`)  |
| `![[card:url\|title]]` | saved web card with author title |
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

The **YouTube** (`![[youtube:url]]`) and **iframe** (`![[iframe:url]]`) embeds
reuse the shared media nodes from `@lyfie/luthor-headless` and carry an optional
`|caption`. A YouTube `watch`/`youtu.be`/`shorts` link is normalized to the
canonical `…/embed/<id>` player URL on the first pass and is byte-stable
afterward; an iframe URL gains `https://` if it has none. Frame size and
alignment are session-only presentation state with no markdown representation
(like image dimensions), so the markdown text itself round-trips unchanged.

## Command surface

The slash menu and command palette are curated down to note-taking primitives:
headings (H1–H3), lists and checklist, quote, code block, table, horizontal
rule, and image. The typography pickers, view tabs, and pinned toolbar are
enforced off.

On top of the curated built-ins, PapyraEditor contributes three note-specific
slash commands through the editor's `extraSlashCommands` seam:

| Command       | Inserts                                                        |
| ------------- | ------------------------------------------------------------- |
| `Link note`   | the `[[` trigger, which opens the wikilink typeahead          |
| `Embed media` | a picked file → `adapter.uploadMedia` → `![[filename]]`       |
| `Insert date` | today's date as `YYYY-MM-DD`                                  |

Each writes markdown-native syntax at the caret, so the body stays the source of
truth and round-trips unchanged. The commands are appended automatically — there
is nothing to wire beyond supplying an `adapter` for `Embed media` to upload
through.
