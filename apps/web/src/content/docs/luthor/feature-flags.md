---
title: Feature Flags
description: Complete feature-flag model for @lyfie/luthor presets, including defaults, overrides, and preset enforcement.
---

# Feature Flags

`@lyfie/luthor` uses feature flags to control what each preset can do, without forking runtime logic.

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

`ExtensiveEditor` starts with all feature flags enabled (`DEFAULT_FEATURE_FLAGS`).

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

Some presets enforce specific flags to protect preset contracts:

- `LegacyRichEditor`: keeps advanced non-markdown features off (embeds, custom nodes, draggable, palette/slash, emoji) while keeping markdown-compatible structure/media features on (`table`, `image`, `horizontalRule`, block alignment, list indentation, `themeToggle`, and `codeIntelligence`).
- `SlashEditor`: enforces `slashCommand: true` and `commandPalette: false`.
- `HeadlessEditorPreset`: keeps a lightweight metadata-friendly profile.
- `SimpleEditor`: hardcodes a minimal visual-only chat input profile.

## Why enforcement exists

Preset contracts must stay stable. If a preset promises markdown/html-native behavior or slash-first behavior, enforced flags prevent accidental drift.

## Feature groups

- Typography:
  - `fontFamily`, `fontSize`, `lineHeight`
- Inline formatting:
  - `bold`, `italic`, `underline`, `strikethrough`, `subscript`, `superscript`, `codeFormat`, `textColor`, `textHighlight`
- Document structure:
  - `blockFormat`, `list`, `horizontalRule`, `table`, `tabIndent`, `enterKeyBehavior`
- Rich content:
  - `image`, `iframeEmbed`, `youTubeEmbed`, `customNode`
- Productivity UI:
  - `history`, `commandPalette`, `slashCommand`, `floatingToolbar`, `contextMenu`, `draggableBlock`, `themeToggle`, `emoji`
- Code workflows:
  - `code`, `codeIntelligence`

## Full flag reference

| Flag | What it controls |
| --- | --- |
| `bold` / `italic` / `underline` / `strikethrough` | Core inline formatting toggles |
| `fontFamily` / `fontSize` / `lineHeight` | Typography selectors and commands |
| `textColor` / `textHighlight` | Text color + highlight tools |
| `subscript` / `superscript` | Script formatting |
| `link` | Link insertion/edit/remove features |
| `horizontalRule` | Divider insertion |
| `table` | Table insertion/editing controls |
| `list` | Ordered/unordered/checklist features |
| `history` | Undo/redo support |
| `image` | Image insertion and image controls |
| `blockFormat` | Paragraph/headings/quote/alignment |
| `code` | Code block features |
| `codeIntelligence` | Code language detect/select/copy tools |
| `codeFormat` | Inline code format command |
| `tabIndent` | Tab/shift-tab list indentation control |
| `enterKeyBehavior` | Hard-break and enter behavior features |
| `iframeEmbed` | iframe embedding tools |
| `youTubeEmbed` | YouTube embedding tools |
| `floatingToolbar` | Floating contextual toolbar |
| `contextMenu` | Context menu workflows |
| `commandPalette` | Command palette overlay |
| `slashCommand` | Slash command menu |
| `emoji` | Emoji insertion/suggestions |
| `draggableBlock` | Drag handles and block moving |
| `customNode` | Custom node insertion support |
| `themeToggle` | Built-in theme toggle control |

## Contributor rules

- Add new flags only in `EXTENSIVE_FEATURE_KEYS`.
- Reflect the flag in `DEFAULT_FEATURE_FLAGS`.
- Wire the flag into extension assembly in `buildExtensiveExtensions(...)`.
- Update preset-specific policies if needed.
- Update docs that describe preset behavior.
