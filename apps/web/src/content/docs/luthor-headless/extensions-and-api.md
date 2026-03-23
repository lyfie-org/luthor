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


