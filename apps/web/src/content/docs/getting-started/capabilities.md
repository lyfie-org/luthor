---
title: Capabilities
description: Complete feature overview for Luthor, with package availability and command-level mapping.
---

# Capabilities

This page shows what Luthor can do today, in plain language, with quick package mapping.

For Lexical engine internals, see: [lexical.dev/docs](https://lexical.dev/docs/intro).

## Capability index

1. Typography Controls
2. Essentials Done Right
3. Color and Highlight
4. Links and Structure
5. Lists
6. Indentation
7. Rich Embeds
8. Code Blocks and Intelligence
9. Theme and Visual Modes
10. History and Keyboard Speed
11. Slash and Command Workflows
12. Custom Blocks

## 1) Typography Controls

![Typography controls preview](/features/Feature1.gif)

Typography features include font family, font size, and line-height controls.  
These are useful when your product needs branded writing styles or accessibility-focused spacing.

- Related commands:
  - `setFontFamily`, `clearFontFamily`, `getFontFamilyOptions`
  - `setFontSize`, `clearFontSize`, `getFontSizeOptions`
  - `setLineHeight`, `clearLineHeight`, `getLineHeightOptions`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 2) Essentials Done Right

![Text formatting essentials preview](/features/Feature2.gif)

Core text formatting supports bold, italic, underline, strikethrough, subscript, superscript, inline code, and quote blocks.

- Related commands:
  - `toggleBold`, `toggleItalic`, `toggleUnderline`, `toggleStrikethrough`
  - `toggleSubscript`, `toggleSuperscript`, `formatText("code")`
  - `toggleQuote`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 3) Color and Highlight

![Color and highlight preview](/features/Feature3.gif)

Text color and highlight options let you apply emphasis without messy inline style logic in your app layer.

- Related commands:
  - `setTextColor`, `clearTextColor`, `getTextColorOptions`
  - `setTextHighlight`, `clearTextHighlight`, `getTextHighlightOptions`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 4) Links and Structure

![Links and structure preview](/features/Feature4.gif)

Luthor supports links, paragraphs, headings (`h1` to `h6`), alignment controls, and quote/code block structure.

- Related commands:
  - `insertLink`, `updateLink`, `removeLink`
  - `toggleParagraph`, `toggleHeading`, `setTextAlignment`
  - `toggleQuote`, `toggleCodeBlock`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 5) Lists

![Lists preview](/features/Feature5.gif)

List workflows include unordered lists, ordered lists, and checklist/task lists.

- Related commands:
  - `toggleUnorderedList`, `toggleOrderedList`, `toggleCheckList`
  - `setOrderedListPattern`, `setOrderedListSuffix`
  - `setUnorderedListPattern`, `setCheckListVariant`
  - `rehydrateListStyles` (for imported JSON style tokens)

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 6) Indentation

![Indentation preview](/features/Feature6.gif)

Indentation behavior is structure-aware. You can cap nesting depth with `maxListIndentation` in presets or configure list/tab extensions directly in headless.

- Related commands:
  - `indentList`, `outdentList`
- Related config:
  - `maxListIndentation` in `ExtensiveEditorProps`
  - `ListExtension({ maxDepth })`
  - `TabIndentExtension({ maxListDepth })`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 7) Rich Embeds

![Rich embed preview](/features/Feature7.gif)

Media support includes images, iframe embeds, and YouTube embeds, including alignment, resize, and caption controls.

- Related commands:
  - `insertImage`, `setImageAlignment`, `setImageCaption`
  - `insertIframeEmbed`, `updateIframeEmbedUrl`, `resizeIframeEmbed`
  - `insertYouTubeEmbed`, `updateYouTubeEmbedUrl`, `resizeYouTubeEmbed`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 8) Code Blocks and Intelligence

![Code block preview](/features/Feature8.gif)

Code workflows include inline code formatting, block-level code nodes, language selection, auto-detection, optional copy support, and line numbers across visual code blocks plus source tabs.

- Related commands:
  - `toggleCodeBlock`, `setCodeLanguage`, `autoDetectCodeLanguage`
  - `getCurrentCodeLanguage`, `copySelectedCodeBlock`
- Related config:
  - `syntaxHighlighting`, `codeHighlightProvider`, `loadCodeHighlightProvider`
  - `showLineNumbers`, `maxAutoDetectCodeLength`, `isCopyAllowed`, `languageOptions`
  - `inlineCodeHighlighting` (preset prop)

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 9) Theme and Visual Modes

![Theme switching preview](/features/Feature9.gif)

Theme support includes light/dark mode and callback hooks so host UI can stay in sync (for example, code highlighting theme CSS).

- Related props:
  - `initialTheme`, `onThemeChange`, `theme`, `editorThemeOverrides`
  - `defaultSettings`, `quoteStyleVars`, `toolbarStyleVars`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 10) History and Keyboard Speed

![Undo, redo, and shortcuts preview](/features/Feature10.gif)

History and keyboard commands are built for fast editing flows.

- Related commands:
  - `undo`, `redo`
- Related props:
  - `shortcutConfig`, `commandPaletteShortcutOnly`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 11) Slash and Command Workflows

![Slash command preview](/features/Feature11.gif)

Slash commands and command palette support command discovery and execution without hunting in toolbars.

- Related commands:
  - `showCommandPalette`, `hideCommandPalette`
  - `setSlashCommands`, `executeSlashCommand`, `closeSlashMenu`
  - `registerCommand`, `registerSlashCommand`
- Related props:
  - `slashCommandVisibility`, `featureFlags.commandPalette`, `featureFlags.slashCommand`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## 12) Custom Blocks

![Custom block preview](/features/Feature12.gif)

Custom node support lets you build product-specific content blocks and keep structured data in editor state.

- Related APIs:
  - `createCustomNodeExtension(...)`
  - `createExtension(...)`
  - `insertCustomNode`

| Package | Availability |
| --- | --- |
| `@lyfie/luthor` | Yes |
| `@lyfie/luthor-headless` | Yes |

## Where to go next

- Preset users: [@lyfie/luthor](/docs/getting-started/luthor/)
- Headless users: [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/)
- Full props map: [Luthor Props Reference](/docs/luthor/props-reference/)
