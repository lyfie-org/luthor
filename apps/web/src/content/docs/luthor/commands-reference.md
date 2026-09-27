---
title: "Commands Reference"
description: "Dedicated command ID reference for @lyfie/luthor, including generated heading commands."
package: "luthor"
docType: "reference"
surface: "command"
keywords:
  - "commands reference"
  - "command ids"
  - "block.align-center"
  - "block.align-justify"
  - "block.align-left"
  - "block.align-right"
  - "block.code-language"
  - "block.code-language.auto"
  - "block.codeblock"
  - "block.heading1"
  - "block.heading2"
  - "block.heading3"
  - "block.heading4"
  - "block.heading5"
  - "block.heading6"
  - "block.paragraph"
  - "block.quote"
  - "edit.redo"
  - "edit.undo"
  - "format.bold"
  - "format.code"
  - "format.italic"
  - "format.strikethrough"
  - "format.subscript"
  - "format.superscript"
  - "format.underline"
  - "insert.emoji"
  - "insert.gif"
  - "insert.horizontal-rule"
  - "insert.iframe"
  - "insert.image"
  - "insert.table"
  - "insert.youtube"
  - "link.insert"
  - "link.remove"
  - "list.bullet"
  - "list.check"
  - "list.numbered"
  - "palette.show"
props:
  - "headingOptions"
exports:
  - "generateCommands"
  - "commandsToCommandPaletteItems"
  - "commandsToSlashCommandItems"
commands:
  - "block.align-center"
  - "block.align-justify"
  - "block.align-left"
  - "block.align-right"
  - "block.code-language"
  - "block.code-language.auto"
  - "block.codeblock"
  - "block.heading1"
  - "block.heading2"
  - "block.heading3"
  - "block.heading4"
  - "block.heading5"
  - "block.heading6"
  - "block.paragraph"
  - "block.quote"
  - "edit.redo"
  - "edit.undo"
  - "format.bold"
  - "format.code"
  - "format.italic"
  - "format.strikethrough"
  - "format.subscript"
  - "format.superscript"
  - "format.underline"
  - "insert.emoji"
  - "insert.gif"
  - "insert.horizontal-rule"
  - "insert.iframe"
  - "insert.image"
  - "insert.table"
  - "insert.youtube"
  - "link.insert"
  - "link.remove"
  - "list.bullet"
  - "list.check"
  - "list.numbered"
  - "palette.show"
extensions:
  []
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "packages/luthor/src/core/commands.ts"
navGroup: "luthor"
navOrder: 140
---

# Commands Reference

This is the canonical command ID reference for preset command workflows.

## What this page answers

- Which command IDs are public?
- Which IDs are generated from heading options?

## Public command IDs

- `block.align-center`
- `block.align-justify`
- `block.align-left`
- `block.align-right`
- `block.code-language`
- `block.code-language.auto`
- `block.codeblock`
- `block.heading1`
- `block.heading2`
- `block.heading3`
- `block.heading4`
- `block.heading5`
- `block.heading6`
- `block.paragraph`
- `block.quote`
- `edit.redo`
- `edit.undo`
- `format.bold`
- `format.code`
- `format.italic`
- `format.strikethrough`
- `format.subscript`
- `format.superscript`
- `format.underline`
- `insert.emoji`
- `insert.gif`
- `insert.horizontal-rule`
- `insert.iframe`
- `insert.image`
- `insert.table`
- `insert.youtube`
- `link.insert`
- `link.remove`
- `list.bullet`
- `list.check`
- `list.numbered`
- `palette.show`

## Host-contributed slash commands

The IDs above are the editor's built-in catalogue, filtered into the slash menu
by `slashCommandVisibility`. To add commands the catalogue does not cover — for
example "Link note" or "Insert date" — pass `extraSlashCommands` to
`<ExtensiveEditor>`. These are appended after the built-ins (so they are **not**
subject to `slashCommandVisibility`, which only filters the built-ins) and also
appear in the command palette.

Each command's `action` receives an `ExtensiveSlashCommandContext`. The slash
trigger (`/query`) is removed and the caret restored before `action` runs, so
`insertText` lands exactly where the slash was typed. The action may be async
(e.g. to await an upload before inserting a reference).

```tsx
<ExtensiveEditor
  extraSlashCommands={[
    {
      id: "app.insert-date",
      label: "Insert date",
      description: "Insert today's date",
      category: "Insert",
      keywords: ["date", "today"],
      action: ({ insertText }) => insertText(new Date().toISOString().slice(0, 10)),
    },
  ]}
/>
```

> Memoize the array so the slash menu is not re-registered on every render.

The `papyra` preset uses this seam internally to contribute its note-taking
commands — "Link note" (drops the `[[` wikilink trigger), "Embed media"
(uploads through the adapter, inserts `![[name]]`), and "Insert date".

## Host-contributed toolbar items

The persistent toolbar takes host controls too. Put the `"customComponent"` item
in your `toolbarLayout` where they should appear, and pass `toolbarCustomItems`
to `<ExtensiveEditor>`. Each `ExtensiveToolbarItem` is one of:

- a **button** — `action` runs on click;
- a **prompting button** — with `input` (`title`, `label`, `placeholder`,
  `submitLabel`, `type`), the toolbar first asks for a value in its own themed
  dialog and passes it to `action` as the second argument;
- a **menu** — with `items`, the button opens a dropdown of those items.

`action` receives an `ExtensiveToolbarItemContext`: `insertText` (as for slash
commands), plus `hasCommand(name)` and `runCommand(name, ...args)`, which
refocuses the editor and runs any registered extension command — so an item can
insert a real node (`insertYouTubeEmbed`, `uploadAndEmbedFile`, …) instead of
markdown text. Items run on the raw command map: the host curates them, so an
item can offer an insert whose built-in feature (and UI) stays switched off.

```tsx
<ExtensiveEditor
  toolbarLayout={{ sections: [{ items: ["bold", "italic"] }, { items: ["customComponent"] }] }}
  toolbarCustomItems={[
    {
      id: "app.embed-video",
      label: "Embed a video",
      icon: <VideoIcon size={16} />,
      input: { title: "Embed a YouTube video", label: "Video link", type: "url" },
      action: ({ runCommand }, url) => {
        if (url) runCommand("insertYouTubeEmbed", url);
      },
    },
  ]}
/>
```

> Memoize the array. Nothing renders at `"customComponent"` when it is empty.

`"customComponent"` places every host item. To place one item on its own —
inside a group, say — use `"custom:<id>"` with the item's `id`.

An `input` can carry more fields under the first with `extraFields` (alt text
under an image link, for instance). `action` then receives the first field's
value and, as a third argument, every value by name:

```tsx
{
  id: "app.image-link",
  label: "Image from a link",
  icon: <ImageIcon size={16} />,
  input: {
    title: "Insert an image from a link",
    label: "Image link",
    type: "url",
    extraFields: [{ name: "alt", label: "Description (alt text)" }],
  },
  action: ({ runCommand }, src, values) => {
    if (src) runCommand("insertImage", { src, alt: values?.alt ?? "" });
  },
}
```

## Toolbar groups

A layout section with a `group` collapses behind one button; its items open in
a small row under it, and the button shows as active while anything inside is
(bold text under a "Text style" group, say). A group can hold any item — a
dropdown, a dialog-opening button, host items — and a menu opened from inside a
group keeps the group open while it is used.

```ts
const layout: ToolbarLayout = {
  sections: [
    { items: ["blockFormat"] },
    { items: ["bold", "italic", "strikethrough", "code"], group: { id: "style", label: "Text style", icon: <BoldIcon size={16} /> } },
    { items: ["unorderedList", "orderedList", "checkList"], group: { id: "lists", label: "Lists" } },
  ],
};
```

Without an `icon`, a group borrows its first item's icon when that item is a
plain button. `isToolbarItemActive(item, activeStates)` is exported for hosts
that draw their own controls.

## Asking for a value

Commands that need a value from the person — an image or embed link, a code
language, an emoji — ask through `commands.requestInput(request)`, which the
extensive editor (and every preset built on it) answers with one themed dialog
and resolves to the values by field name, or `null` on cancel. The toolbar, the
slash menu and the command palette all go through it; only a bare headless host
with no dialog falls back to `window.prompt`. Custom slash commands and toolbar
items can call it too.

Dialogs render in a portal on `<body>`, carrying the editor's theme variables,
so they sit above any chrome the host layers around the editor.


