---
title: "@lyfie/luthor"
description: Minimal setup and validation for the preset package.
---

# @lyfie/luthor

Use this when you want a ready-to-use editor quickly.

## Install

```bash
npm install @lyfie/luthor react react-dom
```

## Render a basic editor

```tsx
import { ExtensiveEditor } from '@lyfie/luthor';
import '@lyfie/luthor/styles.css';

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Validate installation

- You can type in the editor
- Toolbar appears
- No module resolution errors in the dev server
