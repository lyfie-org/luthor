---
title: Presets
description: Preset catalog for @lyfie/luthor, including per-preset docs.
---

# Presets

`@lyfie/luthor` is built around presets. Each preset wraps `ExtensiveEditor` with a specific product profile.

## Contributor guides

- [Architecture](/docs/luthor/architecture/)
- [Props reference](/docs/luthor/props-reference/)
- [Feature flags](/docs/luthor/feature-flags/)

## Re-exported headless API

```ts
import { headless } from '@lyfie/luthor';
```

This gives you direct access to `@lyfie/luthor-headless` APIs when needed.

## Preset matrix

| Preset | Best for | Mode profile |
| --- | --- | --- |
| `ExtensiveEditor` | Full-feature editor UI | `visual-editor`, `visual-only`, `json`, `markdown`, `html` |
| `ComposeEditor` | Focused drafting UI | `visual-only`, `visual`, `json` |
| `SimpleEditor` | Chat/message input | `visual` only |
| `LegacyRichEditor` | Metadata-light markdown/html-compatible flow | Depends on `sourceFormat` |
| `MarkDownEditor` | Markdown-first flow | `visual-only`, `visual`, `json`, `markdown` |
| `HTMLEditor` | HTML-first flow | `visual-only`, `visual`, `json`, `html` |
| `SlashEditor` | Slash-first interactions | `visual-only`, `visual`, `json`, `markdown`, `html` |
| `HeadlessEditorPreset` | Lightweight rich text + source tabs | `visual-only`, `visual`, `json`, `markdown`, `html` |

## Preset docs

- [Extensive Editor](/docs/luthor/presets/extensive-editor/)
- [Compose Editor](/docs/luthor/presets/compose-editor/)
- [Simple Editor](/docs/luthor/presets/simple-editor/)
- [Legacy Rich Editor](/docs/luthor/presets/legacy-rich-editor/)
- [MarkDown Editor](/docs/luthor/presets/md-editor/)
- [HTML Editor](/docs/luthor/presets/html-editor/)
- [Slash Editor](/docs/luthor/presets/slash-editor/)
- [Headless Editor](/docs/luthor/presets/headless-editor-preset/)
