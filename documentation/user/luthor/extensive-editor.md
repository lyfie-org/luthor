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
- trigger JSONB conversion or export workflows
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
- JSONB

Mode switching uses conversion utilities and error handling to avoid silently committing malformed source input.

## Theming

Use `initialTheme` and your host CSS overrides for light/dark and branding adaptation.

## Toolbar Customization

The `ExtensiveEditor` uses the `TRADITIONAL_TOOLBAR_LAYOUT` by default, which groups toolbar items in a familiar pattern similar to traditional word processors. You can customize this by passing a custom `toolbarLayout` prop:

```tsx
import { ExtensiveEditor, TRADITIONAL_TOOLBAR_LAYOUT } from "@lyfie/luthor";

// Use the default traditional layout (explicit)
<ExtensiveEditor toolbarLayout={TRADITIONAL_TOOLBAR_LAYOUT} />

// Or create your own custom layout
const myLayout = {
  sections: [
    { items: ["bold", "italic", "underline"] },
    { items: ["link", "image", "table"] },
    { items: ["undo", "redo"] },
  ],
};

<ExtensiveEditor toolbarLayout={myLayout} />
```

You can also hide the primary toolbar by setting `isToolbarEnabled={false}`. This only affects toolbar rendering; keyboard shortcuts, slash commands, and command palette wiring remain active.

For detailed information on creating custom toolbar layouts, see [toolbar-customization.md](toolbar-customization.md).

## Related docs

- Getting started: [getting-started.md](getting-started.md)
- Presets and configuration: [presets-and-configuration.md](presets-and-configuration.md)
- Developer maintainer notes: [../../developer/luthor/maintainer-notes.md](../../developer/luthor/maintainer-notes.md)
