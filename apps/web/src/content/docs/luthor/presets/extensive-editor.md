---
title: Extensive Editor
description: Full-feature preset and core prop reference.
---

# Extensive Editor

`ExtensiveEditor` is the base preset in `@lyfie/luthor`.  
Every other preset is a focused wrapper around this component.

## Usage

```tsx
import { ExtensiveEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <ExtensiveEditor placeholder="Write anything..." />;
}
```

## Default behavior snapshot

| Category | Default |
| --- | --- |
| Theme | `initialTheme="light"` |
| Mode | `initialMode="visual-editor"` |
| Available modes | `["visual-editor", "visual-only", "json", "markdown", "html"]` |
| Toolbar | Enabled, top, left-aligned |
| Feature flags | All enabled by default |
| Line height baseline | `minimumDefaultLineHeight = 1.5` |
| List indentation | `maxListIndentation = 8` sub-indent levels |
| Code/source line numbers | Enabled (`showLineNumbers = true`) |
| Syntax highlighting | Enabled by default (`isSyntaxHighlightingEnabled = true`) |
| Syntax language/options source | Lexical defaults from `@lexical/code` |

## Core props (high signal)

- Content and mode:
  - `defaultContent`, `showDefaultContent`, `placeholder`
  - `initialMode`, `defaultEditorView`, `availableModes`
  - `isEditorViewTabsVisible` (`isEditorViewsTabVisible` legacy alias)
- Toolbar:
  - `isToolbarEnabled`, `isToolbarPinned`
  - `toolbarPosition`, `toolbarAlignment`, `toolbarLayout`, `toolbarVisibility`
  - `toolbarClassName`, `toolbarStyleVars`
- Editing behavior:
  - `featureFlags`
  - `editOnClick` (promote `visual-only` to editable `visual-editor`)
  - `headingOptions`, `paragraphLabel`, `syncHeadingOptionsWithCommands`
  - `slashCommandVisibility`, `shortcutConfig`, `commandPaletteShortcutOnly`
- Theme and style:
  - `theme`, `editorThemeOverrides`
  - `initialTheme`, `onThemeChange`
  - `defaultSettings`, `quoteClassName`, `quoteStyleVars`
- Typography/code options:
  - `fontFamilyOptions`, `fontSizeOptions`, `lineHeightOptions`
  - `minimumDefaultLineHeight`, `scaleByRatio`
  - `isSyntaxHighlightingEnabled`, `syntaxHighlightColorMode`, `syntaxHighlightColors`
  - `showLineNumbers`, `maxAutoDetectCodeLength`, `isCopyAllowed`, `languageOptions`
  - `maxListIndentation`

Code language support behavior:

- No extra Prism setup import is required for presets.
- Default dropdown options come from Lexical language options.
- If a selected language is not loaded, the dropdown keeps that language selected and highlighting falls back to plaintext colors.

For the full prop-by-prop contract, including every field, see [Props Reference](/docs/luthor/props-reference/).

## Mode behavior details

- `visual-editor`: normal editable visual mode.
- `visual-only`: read mode visual surface. If `editOnClick` is true (default), click can promote to editable mode and place caret near click point.
- `visual`: accepted legacy alias that maps internally to `visual-editor`.
- `json`, `markdown`, `html`: source modes with conversion validation on switch.

If source parsing fails, an inline source error panel is shown and visual content is preserved.

## Lists in Extensive

- Ordered, unordered, and checklist styles are supported.
- `maxListIndentation` applies to all list types.
- Checklist variants:
  - `strikethrough` (default)
  - `plain`
- Style tokens can be rehydrated from imported JSON.

## Syntax Highlighting Controls

Disable syntax highlighting completely:

```tsx
<ExtensiveEditor isSyntaxHighlightingEnabled={false} />
```

Use custom syntax token colors:

```tsx
<ExtensiveEditor
  syntaxHighlightColorMode="custom"
  syntaxHighlightColors={{
    light: {
      comment: "#6a737d",
      keyword: "#a626a4",
      string: "#50a14f",
      number: "#986801",
      function: "#4078f2",
      variable: "#e45649",
    },
    dark: {
      comment: "#6272a4",
      keyword: "#ff79c6",
      string: "#50fa7b",
      number: "#bd93f9",
      function: "#8be9fd",
      variable: "#ffb86c",
    },
  }}
/>
```

If you only provide `light`, those values are reused in dark mode.

## Code view line numbers

Line numbers are enabled by default for:

- Visual code blocks
- JSON source view
- Markdown source view
- HTML source view

Use `showLineNumbers={false}` to disable them globally for this preset instance.

```tsx
<ExtensiveEditor showLineNumbers={false} />
```

## Ref API

- `injectJSON(content: string): void`
- `getJSON(): string`
- `getMarkdown(): string`
- `getHTML(): string`

```tsx
import { useRef } from 'react';
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor';

export function SaveExample() {
  const editorRef = useRef<ExtensiveEditorRef>(null);

  const save = () => {
    const methods = editorRef.current;
    if (!methods) return;
    console.log({
      json: methods.getJSON(),
      markdown: methods.getMarkdown(),
      html: methods.getHTML(),
    });
  };

  return (
    <>
      <button onClick={save}>Save</button>
      <ExtensiveEditor ref={editorRef} />
    </>
  );
}
```
