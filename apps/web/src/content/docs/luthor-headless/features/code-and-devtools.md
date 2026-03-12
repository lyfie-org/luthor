---
title: Code and Devtools
description: Code blocks, syntax support, and markdown/json conversion tools.
---

# Code and Devtools

This group covers code editing and developer-facing conversion utilities.

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
      <button onClick={() => commands.setCodeLanguage?.('ts')}>TypeScript</button>
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

## Example: markdown bridge

```ts
import { markdownToJSON, jsonToMarkdown } from '@lyfie/luthor-headless';

const json = markdownToJSON('# Title\n\nSome text');
const markdown = jsonToMarkdown(json);
```
