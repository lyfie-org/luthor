---
title: Compose Editor
description: Focused rich text drafting preset with a compact, practical toolbar.
---

# Compose Editor

`ComposeEditor` is a focused drafting preset for writing flows where speed and clarity matter more than every possible feature.

## Usage

```tsx
import { ComposeEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return (
    <ComposeEditor
      compactToolbar
      placeholder="Write your draft..."
    />
  );
}
```

## Props

`ComposeEditorProps` inherits all `ExtensiveEditorProps` except direct `featureFlags`, then adds:

- `featureFlags`: `FeatureFlagOverrides` (optional overrides)
- `compactToolbar`: `false (default) | true`

## Default mode profile

- `availableModes`: `["visual", "json"]`
- `availableModes`: `["visual-only", "visual", "json"]`
- Toolbar is enabled by default (inherited from `ExtensiveEditor`).

## Default feature profile

Enabled by default:

- `bold`, `italic`, `underline`, `strikethrough`
- `list`, `history`, `link`, `blockFormat`, `code`, `codeIntelligence`, `codeFormat`

Disabled by default:

- `image`, `table`, `iframeEmbed`, `youTubeEmbed`
- `emoji`, `floatingToolbar`, `contextMenu`
- `commandPalette`, `slashCommand`
- `draggableBlock`, `customNode`

## Behavior

- Great for writing drafts, briefs, notes, and long-form content where rich media is optional.
- Keeps the surface clean while still allowing the core writing commands most teams use daily.
- Supports user-provided `featureFlags` overrides so you can selectively re-enable disabled features.

## Related pages

- [Extensive Editor](/docs/luthor/presets/extensive-editor/)
- [Feature Flags](/docs/luthor/feature-flags/)

