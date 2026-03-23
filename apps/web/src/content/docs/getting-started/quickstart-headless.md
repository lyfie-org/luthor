---
title: "Quickstart: @lyfie/luthor-headless"
description: "Minimal headless runtime setup with typed extension composition in TSX examples."
package: "headless"
docType: "tutorial"
surface: "extension"
keywords:
  - "quickstart"
  - "createEditorSystem"
  - "headless runtime"
  - "extensions"
props:
  []
exports:
  - "createEditorSystem"
  - "RichText"
  - "richTextExtension"
  - "boldExtension"
commands:
  - "format.bold"
extensions:
  - "richTextExtension"
  - "boldExtension"
nodes:
  - "paragraph"
  - "text"
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/headless/src/index.ts"
  - "packages/headless/src/core/createEditorSystem.tsx"
navGroup: "start_here"
navOrder: 60
---

# Quickstart: @lyfie/luthor-headless

Start with headless runtime when your app owns editor UI.

## When to use this

Use this quickstart when you need extension-level control and custom toolbar/layout.

## Install

~~~bash
pnpm add @lyfie/luthor-headless lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/markdown @lexical/html @lexical/selection @lexical/utils
~~~

~~~tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
} from '@lyfie/luthor-headless';

const extensions = [richTextExtension, boldExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands } = useEditor();
  return <button onClick={() => commands.formatText('bold')}>Bold</button>;
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Type here..." />
    </Provider>
  );
}
~~~


