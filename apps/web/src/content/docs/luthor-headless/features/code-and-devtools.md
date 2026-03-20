---
title: Code and Devtools
description: Code blocks, syntax support, and markdown/json conversion tools.
---

# Code and Devtools

This group covers code editing and developer-facing conversion utilities.

Recent defaults:

- Code block language labels use full language names in UI (for example, `TypeScript`, `JavaScript`, `Bash`).
- Language options are filtered by runtime-loaded grammars (unsupported languages are excluded automatically).
- Code block line numbers can be enabled/disabled through `CodeExtensionConfig.showLineNumbers`.

Runtime support notes:

- `@lyfie/luthor-headless` does not force-load Prism grammars. It only allows languages that the active runtime can actually tokenize.
- If you want extra languages such as `bash`, `yaml`, or `docker`, load the matching Prism components in your app before mounting the editor.

```ts
import 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
```

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

## Example: markdown bridge

```ts
import { markdownToJSON, jsonToMarkdown } from '@lyfie/luthor-headless';

const json = markdownToJSON('# Title\n\nSome text');
const markdown = jsonToMarkdown(json);
```
