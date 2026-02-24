---
title: Interaction and Productivity
description: Slash commands, command palette, shortcuts, history, and contextual UI.
---

# Interaction and Productivity

This group covers keyboard-first and contextual workflows.

## Included extensions

- `historyExtension`
- `enterKeyBehaviorExtension`
- `commandPaletteExtension`
- `slashCommandExtension`
- `floatingToolbarExtension`
- `contextMenuExtension`
- `emojiExtension`
- `draggableBlockExtension`

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
