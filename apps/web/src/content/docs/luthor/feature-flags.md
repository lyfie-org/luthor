---
title: "Feature Flags"
description: "Complete feature flag set, defaults, and preset-level enforcement behavior for @lyfie/luthor."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "feature flags"
  - "bold"
  - "italic"
  - "underline"
  - "strikethrough"
  - "fontFamily"
  - "fontSize"
  - "lineHeight"
  - "textColor"
  - "textHighlight"
  - "subscript"
  - "superscript"
  - "link"
  - "horizontalRule"
  - "table"
  - "list"
  - "history"
  - "image"
  - "blockFormat"
  - "code"
  - "codeIntelligence"
  - "codeFormat"
  - "tabIndent"
  - "enterKeyBehavior"
  - "iframeEmbed"
  - "youTubeEmbed"
  - "floatingToolbar"
  - "contextMenu"
  - "commandPalette"
  - "slashCommand"
  - "emoji"
  - "draggableBlock"
  - "customNode"
  - "themeToggle"
props:
  - "featureFlags"
exports:
  - "FeatureFlag"
  - "FeatureFlags"
  - "FeatureFlagOverrides"
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "packages/luthor/src/presets/extensive/extensions.tsx"
  - "packages/luthor/src/presets/slash-editor/SlashEditor.tsx"
  - "packages/luthor/src/presets/headless-editor/HeadlessEditorPreset.tsx"
navGroup: "luthor"
navOrder: 30
---

# Feature Flags

This is the source-of-truth page for preset feature gating.

## What this page answers

- Which flags exist?
- What is the default baseline?
- Which presets enforce overrides?

## Baseline default

`ExtensiveEditor` defaults all 33 feature flags to `true`.

## Full feature flag set

- `bold`
- `italic`
- `underline`
- `strikethrough`
- `fontFamily`
- `fontSize`
- `lineHeight`
- `textColor`
- `textHighlight`
- `subscript`
- `superscript`
- `link`
- `horizontalRule`
- `table`
- `list`
- `history`
- `image`
- `blockFormat`
- `code`
- `codeIntelligence`
- `codeFormat`
- `tabIndent`
- `enterKeyBehavior`
- `iframeEmbed`
- `youTubeEmbed`
- `floatingToolbar`
- `contextMenu`
- `commandPalette`
- `slashCommand`
- `emoji`
- `draggableBlock`
- `customNode`
- `themeToggle`


