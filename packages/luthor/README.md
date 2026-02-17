# Luthor Presets

Presets and plug-and-play configurations for the Luthor headless editor.

## Install

```bash
npm install @lyfie/luthor @lyfie/luthor-headless
```

Install the Lexical peer dependencies:

```bash
npm install lexical @lexical/react @lexical/html @lexical/markdown @lexical/list @lexical/rich-text @lexical/selection @lexical/utils
```

## Usage

```tsx
import { presetRegistry, defaultPreset } from "@lyfie/luthor";

// Get a preset by id
const preset = presetRegistry.default;

// Or use a named preset directly
const explicit = defaultPreset;
```

## What is included

- Preset definitions (toolbar, config, optional theme)
- Registry lookup by id
- Readme files describing each preset

## Customization

Presets are data objects. You can clone and override any field:

```tsx
import { defaultPreset } from "@lyfie/luthor";

const myPreset = {
  ...defaultPreset,
  id: "my-default",
  label: "My Default",
  toolbar: ["bold", "italic", "link"],
};
```
