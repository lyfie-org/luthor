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
  - "PapyraEditorAdapter"
props:
  - "adapter"
  - "colored"
  - "readOnly"
  - "variant"
  - "locked"
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
nodes:
  - "wikilink"
  - "fileEmbed"
  - "transclusion"
  - "blockAnchor"
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
   `defaultContent` once on mount and never exposes a `value`/`onChange`
   round-trip. Adopt a remote revision by remounting (change the React `key`) or
   by calling `setMarkdown` imperatively, never with a live-DOM patch.
4. **Theming is token-driven.** All color and typography flow from
   `var(--papyra-*, fallback)` tokens. The preset bundles no fonts — the host
   loads Marcellus / Sora / Roboto Mono.

## Locked contract

`PapyraEditor` hard-locks the props it owns; callers cannot reach them:

- Modes are fixed to `['visual', 'markdown']` (no `json`/`html`).
- View tabs hidden; the toolbar is floating-on-selection only (never pinned).
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
- `locked`: withholds the body entirely — renders a blurred placeholder and
  **never mounts the editor**, so there is no plaintext in the DOM. The lock is
  UX only; the server (`401`/`PathGuard`) is the security boundary.
- `onOutlineChange`: fired (debounced) with the current document outline; drives
  a host's live table-of-contents scrollbar. Read-only observation — the caret
  is never touched.
- `featureFlags`: per-feature overrides, resolved through the enforced policy.

## Imperative ref

`PapyraEditorRef` extends `ExtensiveEditorRef` with the markdown-first surface a
host drives: `setMarkdown(md)` (host-driven adopt), `focus()`, `getOutline()` /
`scrollToHeading(key)` for the table of contents, `getBlocks()` for trailing
block anchors, and `getMentions()` for `@username` detection. The host calls
these during its own orchestration (autosave, remount, TOC) — they never fire on
keystrokes.

## The host adapter

The adapter is the entire contract between the preset and the host. The editor
declares it; the host implements it.

~~~ts
interface PapyraEditorAdapter {
  resolveMediaUrl(filename: string): string;                 // ![[file]] → URL
  uploadMedia(file: File): Promise<{ filename: string }>;    // drop/paste → store
  openNote(ref: { title?: string; id?: string }): void;      // [[Note]] → navigate
  searchNotes(q: string): Promise<Array<{ id: string; title: string; color?: string }>>;
  resolveBlock?(ref: { note: string; blockId: string }): Promise<string | null>;
  onMentions?(usernames: string[]): void;
}
~~~

The adapter's resolvers are where the host's server-side authorization lives. The
editor's blur/lock is UX, never the boundary.

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

The embed nodes and transformers live in `@lyfie/luthor-headless` and are
re-exported through `@lyfie/luthor` — the preset only composes and themes them.

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
