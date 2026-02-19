# Extensive Editor Guide

`ExtensiveEditor` is the plug-and-play editor component exported by `@lyfie/luthor`.

## Import

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
```

## Minimal example

```tsx
export function EditorPage() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

## Ref-based integration

`ExtensiveEditor` exposes an imperative ref API (see `ExtensiveEditorRef`) for integration scenarios where host apps need commandable control.

Typical use cases:

- read/write editor content from parent controls
- trigger conversion or export workflows
- inspect current mode and change mode programmatically

## UX modules included

- top `Toolbar`
- contextual `FloatingToolbar`
- `CommandPalette`
- `SlashCommandMenu`
- `EmojiSuggestionMenu`
- `ModeTabs` and `SourceView`

## Conversion and content fidelity

The editor supports visual and source representations:

- canonical editor state
- HTML
- enhanced markdown
- JSONB

Mode switching uses conversion utilities and error handling to avoid silently committing malformed source input.

## Theming

Use `initialTheme` and your host CSS overrides for light/dark and branding adaptation.

## Related docs

- Getting started: [getting-started.md](getting-started.md)
- Presets and configuration: [presets-and-configuration.md](presets-and-configuration.md)
- Developer maintainer notes: [../../developer/luthor/maintainer-notes.md](../../developer/luthor/maintainer-notes.md)
