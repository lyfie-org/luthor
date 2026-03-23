---
title: "Props Reference"
description: "Reference index for ExtensiveEditorProps and common preset prop surfaces, including mode and bridge controls."
package: "luthor"
docType: "reference"
surface: "prop"
keywords:
  - "props reference"
  - "ExtensiveEditorProps"
  - "className"
  - "onReady"
  - "initialTheme"
  - "onThemeChange"
  - "theme"
  - "defaultContent"
  - "showDefaultContent"
  - "placeholder"
  - "defaultEditorView"
  - "initialMode"
  - "isEditorViewTabsVisible"
  - "isEditorViewsTabVisible"
  - "availableModes"
  - "variantClassName"
  - "toolbarLayout"
  - "toolbarVisibility"
  - "toolbarPosition"
  - "toolbarAlignment"
  - "toolbarClassName"
  - "toolbarStyleVars"
  - "quoteClassName"
  - "quoteStyleVars"
  - "defaultSettings"
  - "editorThemeOverrides"
  - "isToolbarEnabled"
  - "isToolbarPinned"
  - "fontFamilyOptions"
  - "fontSizeOptions"
  - "lineHeightOptions"
  - "minimumDefaultLineHeight"
  - "scaleByRatio"
  - "headingOptions"
  - "paragraphLabel"
  - "syncHeadingOptionsWithCommands"
  - "slashCommandVisibility"
  - "shortcutConfig"
  - "commandPaletteShortcutOnly"
  - "isListStyleDropdownEnabled"
  - "editOnClick"
  - "isDraggableBoxEnabled"
  - "featureFlags"
  - "sourceMetadataMode"
  - "markdownBridgeFlavor"
  - "markdownSourceOfTruth"
  - "isSyntaxHighlightingEnabled"
  - "syntaxHighlightColorMode"
  - "syntaxHighlightColors"
  - "maxAutoDetectCodeLength"
  - "isCopyAllowed"
  - "languageOptions"
  - "showLineNumbers"
  - "maxListIndentation"
props:
  - "className"
  - "onReady"
  - "initialTheme"
  - "onThemeChange"
  - "theme"
  - "defaultContent"
  - "showDefaultContent"
  - "placeholder"
  - "defaultEditorView"
  - "initialMode"
  - "isEditorViewTabsVisible"
  - "isEditorViewsTabVisible"
  - "availableModes"
  - "variantClassName"
  - "toolbarLayout"
  - "toolbarVisibility"
  - "toolbarPosition"
  - "toolbarAlignment"
  - "toolbarClassName"
  - "toolbarStyleVars"
  - "quoteClassName"
  - "quoteStyleVars"
  - "defaultSettings"
  - "editorThemeOverrides"
  - "isToolbarEnabled"
  - "isToolbarPinned"
  - "fontFamilyOptions"
  - "fontSizeOptions"
  - "lineHeightOptions"
  - "minimumDefaultLineHeight"
  - "scaleByRatio"
  - "headingOptions"
  - "paragraphLabel"
  - "syncHeadingOptionsWithCommands"
  - "slashCommandVisibility"
  - "shortcutConfig"
  - "commandPaletteShortcutOnly"
  - "isListStyleDropdownEnabled"
  - "editOnClick"
  - "isDraggableBoxEnabled"
  - "featureFlags"
  - "sourceMetadataMode"
  - "markdownBridgeFlavor"
  - "markdownSourceOfTruth"
  - "isSyntaxHighlightingEnabled"
  - "syntaxHighlightColorMode"
  - "syntaxHighlightColors"
  - "maxAutoDetectCodeLength"
  - "isCopyAllowed"
  - "languageOptions"
  - "showLineNumbers"
  - "maxListIndentation"
exports:
  - "ExtensiveEditorProps"
  - "ExtensiveEditorRef"
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/presets/extensive/ExtensiveEditor.tsx"
navGroup: "luthor"
navOrder: 40
---

# Props Reference

Use this page for exact prop names and discovery tokens.

## What this page answers

- Which props control modes, source bridges, and feature gates?

## High-signal props

| Area | Props |
| --- | --- |
| Mode control | `initialMode`, `defaultEditorView`, `availableModes` |
| Feature gating | `featureFlags`, `headingOptions`, `slashCommandVisibility` |
| Bridge control | `sourceMetadataMode`, `markdownBridgeFlavor`, `markdownSourceOfTruth` |
| Code intelligence | `isSyntaxHighlightingEnabled`, `syntaxHighlightColorMode`, `maxAutoDetectCodeLength`, `languageOptions`, `showLineNumbers` |
| List depth | `maxListIndentation` |

## Preset-level code intelligence toggle

- `ExtensiveEditor`, `ComposeEditor`, `SlashEditor`, `LegacyRichEditor`, `HTMLEditor`, `MarkDownEditor`, and `HeadlessEditorPreset` use `featureFlags.codeIntelligence`.
- `SimpleEditor` supports scoped `featureFlags.codeIntelligence`.

~~~tsx
<SlashEditor featureFlags={{ codeIntelligence: false }} />
<SimpleEditor featureFlags={{ codeIntelligence: true }} />
~~~

## Full `ExtensiveEditorProps` index

- `className`
- `onReady`
- `initialTheme`
- `onThemeChange`
- `theme`
- `defaultContent`
- `showDefaultContent`
- `placeholder`
- `defaultEditorView`
- `initialMode`
- `isEditorViewTabsVisible`
- `isEditorViewsTabVisible`
- `availableModes`
- `variantClassName`
- `toolbarLayout`
- `toolbarVisibility`
- `toolbarPosition`
- `toolbarAlignment`
- `toolbarClassName`
- `toolbarStyleVars`
- `quoteClassName`
- `quoteStyleVars`
- `defaultSettings`
- `editorThemeOverrides`
- `isToolbarEnabled`
- `isToolbarPinned`
- `fontFamilyOptions`
- `fontSizeOptions`
- `lineHeightOptions`
- `minimumDefaultLineHeight`
- `scaleByRatio`
- `headingOptions`
- `paragraphLabel`
- `syncHeadingOptionsWithCommands`
- `slashCommandVisibility`
- `shortcutConfig`
- `commandPaletteShortcutOnly`
- `isListStyleDropdownEnabled`
- `editOnClick`
- `isDraggableBoxEnabled`
- `featureFlags`
- `sourceMetadataMode`
- `markdownBridgeFlavor`
- `markdownSourceOfTruth`
- `isSyntaxHighlightingEnabled`
- `syntaxHighlightColorMode`
- `syntaxHighlightColors`
- `maxAutoDetectCodeLength`
- `isCopyAllowed`
- `languageOptions`
- `showLineNumbers`
- `maxListIndentation`


