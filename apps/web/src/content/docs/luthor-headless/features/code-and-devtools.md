---
title: Code and Devtools
description: Code blocks, syntax support, and markdown/json conversion tools.
---

# Code and Devtools

This group covers code editing and developer-facing utilities.

## Included extensions and utilities

- `codeExtension`
- `codeIntelligenceExtension`
- `codeFormatExtension`
- `markdownToJSONB`, `jsonbToMarkdown`

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
  return <button onClick={() => commands.insertCodeBlock?.({ language: 'ts' })}>Code Block</button>;
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
import { markdownToJSONB, jsonbToMarkdown } from '@lyfie/luthor-headless';

const json = markdownToJSONB('# Title\n\nSome text');
const markdown = jsonbToMarkdown(json);
```
