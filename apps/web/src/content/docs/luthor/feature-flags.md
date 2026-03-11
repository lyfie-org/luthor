---
title: Feature Flags
description: Complete feature-flag model for @lyfie/luthor presets, including defaults, overrides, and preset enforcement.
---

# Feature Flags

`@lyfie/luthor` uses feature flags to compose preset capability without forking runtime logic.

## Source of truth

Canonical keys are defined in `packages/luthor/src/presets/extensive/extensions.tsx` as `EXTENSIVE_FEATURE_KEYS`.

```ts
type FeatureFlag =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'textColor'
  | 'textHighlight'
  | 'subscript'
  | 'superscript'
  | 'link'
  | 'horizontalRule'
  | 'table'
  | 'list'
  | 'history'
  | 'image'
  | 'blockFormat'
  | 'code'
  | 'codeIntelligence'
  | 'codeFormat'
  | 'tabIndent'
  | 'enterKeyBehavior'
  | 'iframeEmbed'
  | 'youTubeEmbed'
  | 'floatingToolbar'
  | 'contextMenu'
  | 'commandPalette'
  | 'slashCommand'
  | 'emoji'
  | 'draggableBlock'
  | 'customNode'
  | 'themeToggle';
```

## Default behavior

`ExtensiveEditor` defaults to all flags enabled (`DEFAULT_FEATURE_FLAGS`).

Disable selectively:

```tsx
<ExtensiveEditor
  featureFlags={{
    image: false,
    table: false,
    customNode: false,
    commandPalette: false,
  }}
/>
```

## Preset enforcement

Some presets hard-enforce specific flags:

- `LegacyRichEditor`: enforces metadata-heavy features off (table, image, embeds, custom nodes, draggable, palette/slash, emoji, theme toggle).
- `SlashEditor`: enforces `slashCommand: true` and `commandPalette: false`.
- `HeadlessEditorPreset`: enforces a lightweight metadata-free profile.
- `SimpleEditor`: hardcodes a minimal visual-only feature set for message input.

## Why enforcement exists

Preset contracts must stay stable. If a preset promises metadata-free markdown/html workflows or slash-first behavior, enforced flags prevent accidental contract drift.

## Feature groups

- Typography: `fontFamily`, `fontSize`, `lineHeight`
- Inline formatting: `bold`, `italic`, `underline`, `strikethrough`, `subscript`, `superscript`, `codeFormat`, `textColor`, `textHighlight`
- Document structure: `blockFormat`, `list`, `horizontalRule`, `table`, `tabIndent`, `enterKeyBehavior`
- Rich content: `image`, `iframeEmbed`, `youTubeEmbed`, `customNode`
- Productivity UI: `history`, `commandPalette`, `slashCommand`, `floatingToolbar`, `contextMenu`, `draggableBlock`, `themeToggle`, `emoji`
- Code workflows: `code`, `codeIntelligence`

## Contributor rules

- Add new flags only in `EXTENSIVE_FEATURE_KEYS`.
- Reflect the flag in `DEFAULT_FEATURE_FLAGS`.
- Wire the flag into extension assembly in `buildExtensiveExtensions(...)`.
- Update preset-specific policies if needed.
- Update docs that describe preset behavior.
