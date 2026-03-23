---
title: "Astro Integration"
description: "Astro + React integration pattern using client hydration directives for editor rendering."
package: "integrations"
docType: "integration"
surface: "tooling"
keywords:
  - "astro integration"
  - "client:only"
  - "react renderer"
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
  - "astro"
lastVerifiedFrom:
  - "packages/luthor/src/index.ts"
navGroup: "integrations"
navOrder: 30
---

# Astro Integration

Astro works through React islands with client hydration.

## What works

- React component wrapper for preset editor.
- `client:only="react"` or `client:load` hydration.

## Install

~~~bash
pnpm add @lyfie/luthor @astrojs/react
~~~

~~~tsx
import '@lyfie/luthor/styles.css';
import { ExtensiveEditor } from '@lyfie/luthor';

export function EditorIsland() {
  return <ExtensiveEditor placeholder="Write here..." />;
}
~~~

## Caveats

- Use hydrated islands (`client:only` or `client:load`) for editor rendering.
- Keep editor CSS import in the React island/component boundary.

## Related docs

- [@lyfie/luthor Presets](/docs/luthor/presets/)
- [@lyfie/luthor-headless Overview](/docs/luthor-headless/overview/)


