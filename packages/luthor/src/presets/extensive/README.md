# Extensive preset

## Purpose
Feature rich preset for power users and content heavy apps.

## Features
- Full formatting suite and block types
- Tables, media, embeds, and columns
- Advanced list styles and nesting
- Context menu, command palette, floating toolbar, and drag handles
- HTML/Markdown export and source modes

## Customizability
- Toggle advanced blocks by section
- Configure embed providers
- Theme options for dense UI
- Output policy controls and validation

## Plug and play
```tsx
import { ExtensiveEditor, extensivePreset } from "@lyfie/luthor";

export function Page() {
	return <ExtensiveEditor />;
}

// Access extensions or preset metadata if needed
const { extensions } = extensivePreset;
```
