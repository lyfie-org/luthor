---
title: Architecture
description: "Internal runtime model of @lyfie/luthor-headless: editor system, extension lifecycle, and conversion bridges."
---

# @lyfie/luthor-headless Architecture

`@lyfie/luthor-headless` is a typed extension runtime built on Lexical.

- No preset UI is forced on you.
- You mount extensions, then build UI from typed `commands` and `activeStates`.

## High-level runtime flow

1. Define an extension array.
2. Create a typed system with `createEditorSystem<typeof extensions>()`.
3. Render `<Provider extensions={extensions}>`.
4. Use `useEditor()` in UI components.
5. Render `<RichText />` (or your own contenteditable plugin stack).

## Core modules

- `packages/headless/src/core/createEditorSystem.tsx`
  - Typed provider/hook generation
  - Command/state aggregation
  - Extension registration order by `initPriority`
- `packages/headless/src/core/createExtension.ts`
  - Extension factory for quick custom extensions
- `packages/headless/src/extensions/**`
  - Built-in extension catalog
- `packages/headless/src/core/markdown.ts` and `html.ts`
  - JSON <-> Markdown/HTML conversion bridges
- `packages/headless/src/core/metadata-envelope.ts`
  - Metadata envelope preservation for unsupported/non-native fields

## What Provider is responsible for

- Collect Lexical nodes from all extensions.
- Register extensions and cleanup subscriptions.
- Build a typed command surface from extension `getCommands(...)`.
- Build async state query map from `getStateQueries(...)`.
- Keep `activeStates` in sync on editor updates.
- Render plugins before/after children based on extension `config.position`.
- Expose:
  - `export.toJSON()`
  - `import.fromJSON(...)`
  - `listeners.registerUpdate(...)`
  - `listeners.registerPaste(...)`

## Extension contract

Each extension follows the `Extension` interface:

- `name`, `category`, `config`
- `register(editor) => cleanup`
- `getCommands(editor)`
- `getStateQueries(editor)` (optional)
- `getPlugins()`
- `getNodes()` (optional)

Use `createExtension(...)` for simple command/plugin additions.  
Use `BaseExtension` for richer lifecycle customization.

## Runtime mutation note

`extensionsAPI.add/remove/reorder` is intentionally read-only at runtime and logs warnings.  
To change loaded extensions, pass a new `extensions` array to `<Provider />`.

## RichText rendering model

`RichText` / `richTextExtension` supports:

- String or element placeholders
- `classNames` and `styles` for container/content/placeholder
- `nonEditableVisualMode`
- `onEditIntent` callback (useful for read-first surfaces)

## Bridge architecture

Source conversion is JSON-centered:

- Visual editor state is JSON.
- `jsonToMarkdown` / `markdownToJSON`
- `jsonToHTML` / `htmlToJSON`
- Metadata envelopes preserve unsupported nodes and extra fields.

More detail: [Metadata Comment System](/docs/luthor-headless/metadata-comment-system/).

## Contributor entry points

- Extension authoring: `packages/headless/src/extensions`
- Type contracts: `packages/headless/src/extensions/types.ts`
- Provider runtime behavior: `packages/headless/src/core/createEditorSystem.tsx`
- Bridge logic: `packages/headless/src/core/markdown.ts`, `packages/headless/src/core/html.ts`, `packages/headless/src/core/metadata-envelope.ts`
