---
title: Code and Devtools
description: Code blocks, syntax support, and markdown/json conversion tools.
---

# Code and Devtools

This group covers code editing and developer-facing conversion utilities.

Recent defaults:

- Code block language labels use full language names in UI (for example, `TypeScript`, `JavaScript`, `SQL`).
- Default language options are filtered to languages that are actually supported by the active runtime tokenizer.
- Built-in popular language preload covers: `bash`, `json`, `yaml`, `go`, `php`, `ruby`, `csharp`, `kotlin`, `jsx`, `tsx`, `graphql`, `docker`, `toml`, `lua`, `perl`, `r`, `scala`, `dart`.
- Combined with Lexical defaults, common dropdown languages include `TypeScript`, `JavaScript`, `JSX`, `TSX`, `JSON`, `Python`, `Java`, `C/C++`, `C#`, `Go`, `Rust`, `PHP`, `Ruby`, `Kotlin`, `Swift`, `SQL`, `PowerShell`, `GraphQL`, `Dockerfile`, `TOML`, `Lua`, `Perl`, `R`, `Scala`, `Dart`, `HTML`, `CSS`, `Markdown`, `XML`, and `YAML`.
- Unsupported languages are normalized to plain text to avoid stale token classes when switching code languages.
- Code block line numbers can be enabled/disabled through `CodeExtensionConfig.showLineNumbers`.
- Syntax colors are applied only when your app loads `highlight.js` theme CSS (or equivalent custom `.hljs*` styles).

## Included extensions and utilities

- `codeExtension`
- `codeIntelligenceExtension`
- `codeFormatExtension`
- `markdownToJSON`, `jsonToMarkdown`
- `htmlToJSON`, `jsonToHTML`

## Key commands

- `toggleCodeBlock`
- `setCodeLanguage`
- `autoDetectCodeLanguage`
- `getCurrentCodeLanguage`
- `getCodeLanguageOptions`
- `copySelectedCodeBlock`
- `formatText("code")` (inline code)

## Example: code editor setup

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  codeExtension,
  codeIntelligenceExtension,
} from '@lyfie/luthor-headless';

const extensions = [richTextExtension, codeExtension, codeIntelligenceExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleCodeBlock?.()}>Code Block</button>
      <button onClick={() => commands.setCodeLanguage?.('typescript')}>TypeScript</button>
      <button onClick={() => void commands.autoDetectCodeLanguage?.()}>Auto detect</button>
      <button onClick={() => void commands.copySelectedCodeBlock?.()}>Copy code</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write docs with code..." />
    </Provider>
  );
}
```

## Line number config example

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  codeExtension,
} from '@lyfie/luthor-headless';

const extensions = [richTextExtension, codeExtension.configure({ showLineNumbers: true })] as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function App() {
  return (
    <Provider extensions={extensions}>
      <RichText />
    </Provider>
  );
}
```

## Syntax style setup (`highlight.js`)

Use either a local/public stylesheet or a CDN stylesheet:

- Local/public files:
  - light: `/highlightjs/github.css`
  - dark: `/highlightjs/github-dark.css`
- CDN files:
  - light: `https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css`
  - dark: `https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css`

Then switch URLs on your theme change callback so code block colors stay in sync.

## Example: markdown bridge

```ts
import { markdownToJSON, jsonToMarkdown } from '@lyfie/luthor-headless';

const json = markdownToJSON('# Title\n\nSome text');
const markdown = jsonToMarkdown(json);
```
