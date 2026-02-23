---
title: "Headless Source File Reference (Developer)"
---

# Headless Source File Reference (Developer)

This is the canonical per-file reference for `packages/headless`.

## Package-Level Files

| File | Purpose |
|---|---|
| `packages/headless/package.json` | Package metadata, exports, scripts, peer dependencies (`lexical`, `@lexical/*`, `react`, `react-dom`) and optional dependency (`highlight.js`). |
| `packages/headless/tsup.config.ts` | Build output configuration for ESM package artifacts and declarations. |
| `packages/headless/tsconfig.json` | TypeScript settings for package compilation and editor diagnostics. |
| `packages/headless/eslint.config.js` | Linting rules for package source quality and consistency. |
| `packages/headless/src/index.ts` | Top-level barrel that re-exports `core`, `extensions`, and `utils`. |

## Core (`src/core`)

| File | What it does |
|---|---|
| `src/core/createEditorSystem.tsx` | Creates typed `Provider` and `useEditor`; aggregates extension commands, state queries, nodes, plugins, lifecycle hooks, and import/export APIs. |
| `src/core/createExtension.ts` | Functional extension factory that builds extension instances without class inheritance boilerplate. |
| `src/core/index.ts` | Re-exports runtime, theme helpers, and core types. |
| `src/core/theme.ts` | Defines `LuthorTheme`, default theme object, theme merge helper, and runtime shape guard. |
| `src/core/types.ts` | Core-side type contracts and compatibility exports for editor config/context typing. |

## Extension Typing and Barrels

| File | What it does |
|---|---|
| `src/extensions/types.ts` | Canonical extension generics and extract-utility types for typed command/state composition. |
| `src/extensions/index.ts` | Master barrel for all extension categories. |

## Base Extensions (`src/extensions/base`)

| File | What it does |
|---|---|
| `src/extensions/base/BaseExtension.ts` | Abstract extension base class with configurable defaults and extension lifecycle hooks. |
| `src/extensions/base/TextFormatExtension.ts` | Shared implementation for text-format toggles and active-state queries (bold/italic/etc.). |
| `src/extensions/base/index.ts` | Barrel exports for base extension primitives. |

## Core UX Extensions (`src/extensions/core`)

| File | What it does |
|---|---|
| `src/extensions/core/CommandPaletteExtension.tsx` | Registers executable command palette items, command registry state, and execution helpers. |
| `src/extensions/core/ContextMenuExtension.tsx` | Headless context-menu provider/renderer system with portal-based rendering. |
| `src/extensions/core/DraggableBlockExtension.tsx` | Implements draggable block handles, drop indicators, and block-move commands. |
| `src/extensions/core/EmojiExtension.tsx` | Emoji insertion and emoji picker/suggestion command/state surface. |
| `src/extensions/core/EnterKeyBehaviorExtension.ts` | Overrides Enter behavior contextually for code blocks, quotes, and tables. |
| `src/extensions/core/FloatingToolbarExtension.tsx` | Selection-anchored floating toolbar framework and state model. |
| `src/extensions/core/HistoryExtension.tsx` | Undo/redo integration via Lexical history plugin and typed commands. |
| `src/extensions/core/RichTextExtension.tsx` | Baseline rich text plugin wiring, content editable, placeholder, and error boundary behavior. |
| `src/extensions/core/SlashCommandExtension.tsx` | Slash-trigger command menu registration and execution flow. |
| `src/extensions/core/TabIndentExtension.tsx` | Tab / Shift+Tab indent-outdent handling for relevant node contexts. |
| `src/extensions/core/index.ts` | Barrel for all core UX extensions and related types. |

## Custom (`src/extensions/custom`)

| File | What it does |
|---|---|
| `src/extensions/custom/CustomNodeExtension.tsx` | Factory for custom DecoratorNode-based extensions with React rendering hooks. |
| `src/extensions/custom/index.ts` | Barrel for custom extension APIs. |

## Formatting Extensions (`src/extensions/formatting`)

| File | What it does |
|---|---|
| `src/extensions/formatting/BlockFormatExtension.tsx` | Heading/paragraph/quote toggles and text alignment commands/state. |
| `src/extensions/formatting/BoldExtension.tsx` | Bold text format specialization. |
| `src/extensions/formatting/CodeExtension.tsx` | Block code-node support, highlighting integration, and code block command behaviors. |
| `src/extensions/formatting/CodeFormatExtension.tsx` | Inline code text-format specialization. |
| `src/extensions/formatting/CodeIntelligenceExtension.ts` | Language-aware code-block helpers (detection, language controls, markdown shortcuts). |
| `src/extensions/formatting/FontFamilyExtension.tsx` | Whitelisted font-family options with command/query APIs and CSS loading strategies. |
| `src/extensions/formatting/FontSizeExtension.tsx` | Whitelisted font-size options with command/query APIs. |
| `src/extensions/formatting/HorizontalRuleExtension.tsx` | Horizontal-rule insertion and markdown transformer integration. |
| `src/extensions/formatting/ItalicExtension.tsx` | Italic text format specialization. |
| `src/extensions/formatting/LineHeightExtension.tsx` | Whitelisted line-height options with command/query APIs. |
| `src/extensions/formatting/LinkExtension.tsx` | Link insertion/removal, validation, and optional autolink/paste behavior. |
| `src/extensions/formatting/ListExtension.tsx` | Ordered, unordered, and checklist commands/state with list node integration. |
| `src/extensions/formatting/StrikethroughExtension.tsx` | Strikethrough text format specialization. |
| `src/extensions/formatting/SubscriptExtension.tsx` | Subscript text format specialization. |
| `src/extensions/formatting/SuperscriptExtension.tsx` | Superscript text format specialization. |
| `src/extensions/formatting/TableExtension.tsx` | Rich table operations (rows/cols/headers/merge) and optional contextual table UI. |
| `src/extensions/formatting/TextColorExtension.tsx` | Whitelisted text-color options with command/query APIs. |
| `src/extensions/formatting/TextHighlightExtension.tsx` | Whitelisted text-highlight options with command/query APIs. |
| `src/extensions/formatting/UnderlineExtension.tsx` | Underline text format specialization and markdown transformer support. |
| `src/extensions/formatting/index.ts` | Barrel exports for formatting extensions and related configuration types. |

## Media Extensions (`src/extensions/media`)

| File | What it does |
|---|---|
| `src/extensions/media/types.ts` | Shared media model types (alignment, payloads, image extension contracts). |
| `src/extensions/media/ImageTranslator.ts` | Serialization and DOM translation utilities for image nodes. |
| `src/extensions/media/ImageExtension.tsx` | Image node, insert/update commands, upload integration, markdown transformer, selection UX. |
| `src/extensions/media/IframeEmbedExtension.tsx` | Generic iframe embed node and command/state APIs with validation and sizing controls. |
| `src/extensions/media/YouTubeEmbedExtension.tsx` | YouTube-specific embed node, URL parsing, and player option handling. |
| `src/extensions/media/index.ts` | Barrel for media extension surface. |

## Utilities (`src/utils`)

| File | What it does |
|---|---|
| `src/utils/index.ts` | Utility barrel for package-level helper exports. |

## Contributor guidance

- Keep this document updated whenever files are added, removed, renamed, or significantly repurposed.
- Any new extension file must document: commands, state queries, config shape, and integration dependencies.
