---
title: "Extensions and API"
description: "Extension categories, API contracts, and how to compose command/state surfaces safely."
package: "headless"
docType: "guide"
surface: "extension"
keywords:
  - "extensions"
  - "createExtension"
  - "ExtensionCategory"
  - "commands API"
props:
  []
exports:
  - "createExtension"
  - "ExtensionCategory"
  - "createCustomNodeExtension"
commands:
  []
extensions:
  - "BaseExtension"
  - "blockFormatExtension"
  - "BlockFormatExtension"
  - "boldExtension"
  - "BoldExtension"
  - "codeExtension"
  - "CodeExtension"
  - "codeFormatExtension"
  - "CodeFormatExtension"
  - "codeIntelligenceExtension"
  - "CodeIntelligenceExtension"
  - "commandPaletteExtension"
  - "CommandPaletteExtension"
  - "contextMenuExtension"
  - "ContextMenuExtension"
  - "createCustomNodeExtension"
  - "createExtension"
  - "draggableBlockExtension"
  - "DraggableBlockExtension"
  - "emojiExtension"
  - "EmojiExtension"
  - "enterKeyBehaviorExtension"
  - "EnterKeyBehaviorExtension"
  - "Extension"
  - "floatingToolbarExtension"
  - "FloatingToolbarExtension"
  - "fontFamilyExtension"
  - "FontFamilyExtension"
  - "fontSizeExtension"
  - "FontSizeExtension"
  - "historyExtension"
  - "HistoryExtension"
  - "horizontalRuleExtension"
  - "HorizontalRuleExtension"
  - "iframeEmbedExtension"
  - "IframeEmbedExtension"
  - "imageExtension"
  - "ImageExtension"
  - "italicExtension"
  - "ItalicExtension"
  - "lineHeightExtension"
  - "LineHeightExtension"
  - "linkExtension"
  - "LinkExtension"
  - "listExtension"
  - "ListExtension"
  - "richTextExtension"
  - "slashCommandExtension"
  - "SlashCommandExtension"
  - "strikethroughExtension"
  - "StrikethroughExtension"
  - "subscriptExtension"
  - "SubscriptExtension"
  - "superscriptExtension"
  - "SuperscriptExtension"
  - "tabIndentExtension"
  - "TabIndentExtension"
  - "tableExtension"
  - "TableExtension"
  - "textColorExtension"
  - "TextColorExtension"
  - "TextFormatExtension"
  - "textHighlightExtension"
  - "TextHighlightExtension"
  - "underlineExtension"
  - "UnderlineExtension"
  - "youTubeEmbedExtension"
  - "YouTubeEmbedExtension"
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/headless/src/core/createExtension.ts"
  - "packages/headless/src/extensions/index.ts"
navGroup: "luthor_headless"
navOrder: 30
---

# Extensions and API

This page defines how extension surfaces are composed.

## What this page answers

- Which extension categories exist?
- How do I add typed commands and state queries?

## API pattern

- Use `createExtension` for composable extension modules.
- Use `createCustomNodeExtension` when adding custom structured blocks.
- Keep command IDs stable and discoverable in docs metadata.



## Pasted markdown

`MarkdownPasteExtension` formats pasted markdown as if it had been typed: pasting `## Title` gives a heading, `- a` a list, `**bold**` bold text. It reads the clipboard's plain text, and only acts when that text really is markdown (a heading, list, quote, fence, table, or inline syntax such as `**bold**`, `` `code` `` and `[text](url)`), so ordinary prose is never rewritten.

It leaves the paste alone when the clipboard carries real formatting (headings, lists, bold, links), when the copy came from inside the editor, when files are pasted, when the caret is in a code block or a table cell, and when the editor is read-only. HTML that is only styled wrappers, as copied from a code editor, does not count as formatting.

Pass `bridge: { extraNodes, extraTransformers }` to have a preset's own syntax (for example Papyra's `[[wikilink]]`) read the same way, or `enabled: false` to switch it off. The `papyra` preset registers it by default (`markdownPaste: false` in the embed options turns it off). `looksLikeMarkdown(text)` and `hasSemanticHtml(html)` are exported for hosts that want the same checks.
