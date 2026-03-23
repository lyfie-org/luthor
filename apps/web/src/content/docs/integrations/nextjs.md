---
title: "Next.js Integration"
description: "Next.js client-boundary integration for presets and headless runtime with TSX examples."
package: "integrations"
docType: "integration"
surface: "tooling"
keywords:
  - "nextjs integration"
  - "use client"
  - "dynamic import"
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
  - "nextjs"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
navGroup: "integrations"
navOrder: 20
---

# Next.js Integration

Next.js works well when the editor is rendered in a client component.

## What works

- Client components with preset package CSS import.
- Dynamic import when you need explicit client-only rendering boundaries.

## Install

~~~bash
pnpm add @lyfie/luthor
~~~

~~~tsx
'use client';

import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export default function EditorClient() {
  return <ExtensiveEditor placeholder="Write here..." />;
}
~~~

## Caveats

- Keep editor components inside client boundaries.
- For heavy routes, use `dynamic(() => import(...), { ssr: false })` when needed.

## Related docs

- [@lyfie/luthor Presets](/docs/luthor/presets/)
- [@lyfie/luthor-headless Overview](/docs/luthor-headless/overview/)


