---
title: "React Integration"
description: "React integration baseline for presets and headless runtime with TSX examples."
package: "integrations"
docType: "integration"
surface: "tooling"
keywords:
  - "react integration"
  - "ExtensiveEditor"
  - "createEditorSystem"
props:
  - "placeholder"
exports:
  - "ExtensiveEditor"
  - "createEditorSystem"
commands:
  []
extensions:
  - "richTextExtension"
nodes:
  []
frameworks:
  - "react"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
  - "packages/headless/src/index.ts"
navGroup: "integrations"
navOrder: 10
---

# React Integration

React is the baseline runtime for both packages.

## What works

- Presets: turnkey with package CSS.
- Headless: fully custom UI with extension composition.

## Install

~~~bash
pnpm add @lyfie/luthor
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export function App() {
  return <ExtensiveEditor placeholder="Write here..." />;
}
~~~

## Caveats

- Keep editor rendering client-side when using SSR frameworks.
- Import preset CSS once at app root.

## Related docs

- [@lyfie/luthor Presets](/docs/luthor/presets/)
- [@lyfie/luthor-headless Overview](/docs/luthor-headless/overview/)


