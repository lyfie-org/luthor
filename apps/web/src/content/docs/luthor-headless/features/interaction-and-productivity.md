---
title: Interaction and Productivity
description: Slash commands, command palette, shortcuts, history, and contextual UI.
---

# Interaction and Productivity

This group covers keyboard-first workflows and contextual editing tools.

## Included extensions

- `historyExtension`
- `enterKeyBehaviorExtension`
- `commandPaletteExtension`
- `slashCommandExtension`
- `floatingToolbarExtension`
- `contextMenuExtension`
- `emojiExtension`
- `draggableBlockExtension`

## Key commands

- History:
  - `undo`, `redo`
- Command palette:
  - `showCommandPalette`, `hideCommandPalette`
  - `registerCommand`, `unregisterCommand`
- Slash commands:
  - `registerSlashCommand`, `unregisterSlashCommand`
  - `setSlashCommands`, `executeSlashCommand`, `closeSlashMenu`
- Emoji:
  - `insertEmoji`, `executeEmojiSuggestion`, `closeEmojiSuggestions`
  - `getEmojiSuggestions`, `getEmojiCatalog`, `resolveEmojiShortcode`
- Draggable/context:
  - extension-driven UI behavior through draggable/context menu plugins
- Enter behavior:
  - `insertHardBreak` (from enter key behavior support)

## Example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  historyExtension,
  commandPaletteExtension,
  slashCommandExtension,
  draggableBlockExtension,
} from '@lyfie/luthor-headless';

const extensions = [
  richTextExtension,
  historyExtension,
  commandPaletteExtension,
  slashCommandExtension,
  draggableBlockExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands } = useEditor();
  return (
    <div>
      <button onClick={() => commands.undo?.()}>Undo</button>
      <button onClick={() => commands.redo?.()}>Redo</button>
      <button onClick={() => commands.showCommandPalette?.()}>Palette</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Type '/' for commands..." />
    </Provider>
  );
}
```
