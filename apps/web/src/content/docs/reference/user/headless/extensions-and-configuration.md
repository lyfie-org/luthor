---
title: "Extensions and Configuration (User)"
---

# Extensions and Configuration (User)

This guide lists the built-in extension groups and common options.

## Extension groups

- Core UX: `richTextExtension`, `historyExtension`, `slashCommandExtension`, `floatingToolbarExtension`, `contextMenuExtension`, `draggableBlockExtension`, `emojiExtension`, `tabIndentExtension`, `enterKeyBehaviorExtension`
- Formatting: `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`, `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`, `codeExtension`, `codeIntelligenceExtension`, `blockFormatExtension`, `listExtension`, `linkExtension`, `tableExtension`, `horizontalRuleExtension`, `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`, `textColorExtension`, `textHighlightExtension`
- Media: `imageExtension`, `iframeEmbedExtension`, `youTubeEmbedExtension`
- Custom: `createCustomNodeExtension(...)`

## Common configuration patterns

### 1) Extension configure pattern

```tsx
const configuredImage = imageExtension.configure({
  defaultAlignment: "center",
  resizable: true,
  uploadHandler: async (file) => {
    // upload and return URL or payload expected by extension
    return URL.createObjectURL(file);
  },
});
```

### 2) Link validation and defaults

```tsx
const configuredLink = linkExtension.configure({
  validateUrl: (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  },
  defaultAttributes: {
    target: "_blank",
    rel: "noopener noreferrer",
  },
});
```

### 3) Controlled typography options

```tsx
const configuredFontFamily = fontFamilyExtension.configure({
  options: [
    { value: "default", label: "Default", fontFamily: "inherit" },
    { value: "inter", label: "Inter", fontFamily: "'Inter', sans-serif" },
  ],
  cssLoadStrategy: "on-demand",
});
```

## Theme configuration

Pass theme through provider config:

```tsx
<Provider
  extensions={extensions}
  config={{
    theme: {
      editor: "editor-shell",
      contentEditable: "editor-content",
      paragraph: "editor-p",
      heading: { h1: "editor-h1", h2: "editor-h2" },
      text: { bold: "font-bold", italic: "italic" },
    },
  }}
>
  <RichText placeholder="Start writing" />
</Provider>
```

## Type-safety tips

- Always declare extensions with `as const`.
- Use `createEditorSystem<typeof extensions>()` to get typed `commands` and `activeStates`.
- Configure extensions once (outside render) and reuse instances.
