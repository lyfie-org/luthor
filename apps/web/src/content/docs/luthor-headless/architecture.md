---
title: Architecture
description: "Internal runtime model of @lyfie/luthor-headless: editor system, extension lifecycle, and conversion bridges."
---

# @lyfie/luthor-headless Architecture

`@lyfie/luthor-headless` is a typed extension runtime on top of Lexical. It does not ship preset UI; you compose your own UI from commands and active states.

## High-level runtime flow

1. Define an extension array.
2. Create a typed system with `createEditorSystem<typeof extensions>()`.
3. Render `<Provider extensions={extensions}>`.
4. Use `useEditor()` in your UI for `commands`, `activeStates`, `export`, and `import`.
5. Render `<RichText />` or your own contenteditable plugin layer.

## Key modules

- `packages/headless/src/core/createEditorSystem.tsx`: provider and hook factory.
- `packages/headless/src/core/createExtension.ts`: typed extension factory.
- `packages/headless/src/extensions/**`: built-in extension catalog.
- `packages/headless/src/core/markdown.ts` and `html.ts`: JSON <-> Markdown/HTML bridges.
- `packages/headless/src/core/metadata-envelope.ts`: metadata comment preservation layer.

## What `Provider` does

- Collects Lexical nodes from all extensions (`getNodes`).
- Registers extensions sorted by `config.initPriority` (higher first).
- Aggregates extension commands into one typed `commands` object.
- Aggregates async state queries into `activeStates`.
- Renders plugins before children when `position` is `'before'`.
- Renders plugins after children when `position` is `'after'`.
- Exposes `export.toJSON()` and `import.fromJSON(...)`.

## Extension lifecycle contract

Every extension follows the `Extension` interface:

- `name`, `category`, `config`
- `register(editor) => cleanup`
- `getCommands(editor)`
- `getStateQueries(editor)` (optional)
- `getPlugins()`
- `getNodes()` (optional)

Use `createExtension(...)` for simple cases. Extend `BaseExtension` for advanced behavior.

## Runtime mutation note

`extensionsAPI.add/remove/reorder` is intentionally read-only at runtime and logs warnings. To change extension sets, pass a new `extensions` array to `Provider`.

## Bridge architecture

Source conversion is JSON-centered:

- visual editor state is JSON
- `jsonToMarkdown` and `jsonToHTML` export source
- `markdownToJSON` and `htmlToJSON` import source
- metadata comments preserve unsupported nodes and non-native fields

Read full details:

- [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)

## Contributor entry points

- Build new extension APIs: `packages/headless/src/extensions`
- Update type contracts: `packages/headless/src/extensions/types.ts`
- Adjust provider lifecycle and state behavior: `packages/headless/src/core/createEditorSystem.tsx`
- Adjust bridge behavior: `packages/headless/src/core/markdown.ts`, `packages/headless/src/core/html.ts`, `packages/headless/src/core/metadata-envelope.ts`
