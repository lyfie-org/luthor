---
title: Typography and Text
description: Fonts, line-height, and text-formatting capabilities.
---

# Typography and Text

This group covers typography, essentials, and color controls.

## Included extensions

- `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`
- `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`
- `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`
- `textColorExtension`, `textHighlightExtension`

## Example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  fontFamilyExtension,
  fontSizeExtension,
  lineHeightExtension,
  textColorExtension,
  textHighlightExtension,
} from '@lyfie/luthor-headless';

const extensions = [
  richTextExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  fontFamilyExtension,
  fontSizeExtension,
  lineHeightExtension,
  textColorExtension,
  textHighlightExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>
      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>
      <button onClick={() => commands.setTextColor?.('#2563eb')}>Blue</button>
      <button onClick={() => commands.setTextHighlight?.('#fef08a')}>Highlight</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Type styled content..." />
    </Provider>
  );
}
```

## Relevant props

- `RichText.placeholder`: `undefined (default) | string`
- `RichText.disabled`: `false (default) | true`

