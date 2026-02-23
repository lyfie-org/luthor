---
title: "Extensive preset"
---

# Extensive preset

All-features preset for advanced authoring and power-user workflows.

## Exports

- `extensivePreset` from `@lyfie/luthor`
- `extensiveExtensions` from `@lyfie/luthor`
- `ExtensiveEditor` from `@lyfie/luthor`
- Types: `ExtensiveEditorRef`, `ExtensiveEditorProps`, `ExtensiveEditorMode`

## Preset metadata

- `id`: `extensive`
- `label`: `Extensive`
- `description`: `All features enabled for power users.`
- `css`: `extensive/styles.css`
- `default placeholder`: `Write anything...`
- `components.Editor`: `ExtensiveEditor`

## Default toolbar

`undo`, `redo`, `heading`, `fontFamily`, `bold`, `italic`, `underline`, `strikethrough`, `link`, `image`, `table`, `horizontalRule`, `blockquote`, `code`, `codeBlock`, `bulletedList`, `numberedList`, `checkList`, `commandPalette`, `floatingToolbar`, `contextMenu`, `draggableBlock`, `customNode`, `sourceMode`, `themeToggle`

## Horizontal rule shortcut

Horizontal rules are available out of the box in the extensive preset.

- Toolbar action: `horizontalRule`
- Command palette action: `Insert Horizontal Rule`
- Markdown shortcuts while typing (then press space/enter): `---`, `___`

## Slash command menu

Notion-style slash commands are enabled in visual mode.

- Type `/` to open the block menu at the caret
- Keep typing to filter commands
- Press `Enter`/`Tab` to run, arrow keys to navigate, `Esc` to close

## Usage

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function ExtensivePage() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](https://github.com/lyfie-app/luthor/blob/main/packages/luthor/README.md)
- Monorepo README: [../../../README.md](https://github.com/lyfie-app/luthor/blob/main/README.md)
- Docs hub: [../../documentation-hub.md](/docs/reference/documentation-hub/)
- Canonical user guide: [../../user/luthor/extensive-editor.md](/docs/reference/user/luthor/extensive-editor/)
- Canonical configuration guide: [../../user/luthor/presets-and-configuration.md](/docs/reference/user/luthor/presets-and-configuration/)


