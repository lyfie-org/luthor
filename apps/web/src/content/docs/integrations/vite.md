---
title: "Vite Integration"
description: "Vite integration baseline for fast local setup with presets or headless runtime."
package: "integrations"
docType: "integration"
surface: "tooling"
keywords:
  - "vite integration"
  - "react vite"
  - "local dev"
props:
  []
exports:
  - "ExtensiveEditor"
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  - "react"
  - "vite"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
navGroup: "integrations"
navOrder: 50
---

# Vite Integration

Vite is the fastest baseline for local editor iteration.

## What works

- Preset editor with CSS import.
- Headless runtime with custom toolbar components.

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

- Keep package versions aligned with peer dependency ranges.
- Use the dependencies page to debug duplicated Lexical versions.

## Related docs

- [@lyfie/luthor Presets](/docs/luthor/presets/)
- [@lyfie/luthor-headless Overview](/docs/luthor-headless/overview/)


