---
title: "Quickstart: @lyfie/luthor"
description: "Minimal preset setup for production-ready editor UI with TSX examples."
package: "luthor"
docType: "tutorial"
surface: "preset"
keywords:
  - "quickstart"
  - "ExtensiveEditor"
  - "preset editor"
  - "react"
props:
  - "placeholder"
  - "featureFlags"
  - "availableModes"
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
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
  - "packages/luthor/src/presets/extensive/ExtensiveEditor.tsx"
navGroup: "start_here"
navOrder: 50
---

# Quickstart: @lyfie/luthor

Start with presets when you want a complete editor quickly.

## When to use this

Use this quickstart when you need toolbar, editing surface, and source modes without building custom UI.

## Install

~~~bash
pnpm add @lyfie/luthor
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export function App() {
  return (
    <ExtensiveEditor
      placeholder="Write anything..."
      availableModes={['visual-editor', 'json', 'markdown', 'html']}
    />
  );
}
~~~


