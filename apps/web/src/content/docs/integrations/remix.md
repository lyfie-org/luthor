---
title: "Remix Integration"
description: "Remix integration pattern for client-rendered editor surfaces with TSX examples."
package: "integrations"
docType: "integration"
surface: "tooling"
keywords:
  - "remix integration"
  - "client rendering"
  - "editor route"
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
  - "remix"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
navGroup: "integrations"
navOrder: 40
---

# Remix Integration

Remix integration is straightforward in client-rendered route components.

## What works

- Preset editor components in route modules.
- Headless runtime in custom React components.

## Install

~~~bash
pnpm add @lyfie/luthor
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export default function EditorRoute() {
  return <ExtensiveEditor placeholder="Write here..." />;
}
~~~

## Caveats

- Render editor in browser runtime route components.
- Import preset CSS in the route/layout that owns the editor surface.

## Related docs

- [@lyfie/luthor Presets](/docs/luthor/presets/)
- [@lyfie/luthor-headless Overview](/docs/luthor-headless/overview/)


