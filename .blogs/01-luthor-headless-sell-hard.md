---
title: Luthor: A Clean React Editor Stack for Speed and Control
description: I built Luthor to remove editor tradeoffs in React apps. Use the preset package for fast WYSIWYG shipping or go headless for full UI control.
slug: introducing-luthor-react-editor-stack
keywords:
  - react rich text editor
  - lexical editor
  - headless rich text editor
  - wysiwyg editor react
  - typescript editor package
---

![Luthor logo](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal-dark.png)

# Luthor: A WYSIWYG React Text Editor for Performance and Control

I built Luthor to end the editor tradeoff: fast setup with lock-in, or full control that burns weeks before you ship anything real at scale.

I just want to build my app! Not wonder what a toolbar icon should look like on the text editor.
I wanted one ecosystem where I can ship fast, then go deep only when I actually need to.

## Quick Links

- Website: https://www.luthor.fyi
- Playground: https://www.luthor.fyi/demo
- Docs: https://www.luthor.fyi/docs/getting-started/index
- GitHub: https://github.com/lyfie-org/luthor
- npm (`@lyfie/luthor`): https://www.npmjs.com/package/@lyfie/luthor
- npm (`@lyfie/luthor-headless`): https://www.npmjs.com/package/@lyfie/luthor-headless

## The components that make Luthor

### The Core - `@lyfie/luthor-headless`

Use this when you want full editor UI control.

- runtime dependencies: **0**
- core engine and related packages are exposed via `peerDependencies`
- you choose exactly what to install and what to customize
- you build your own UI/UX, toolbar, behavior, and design-system integration

This package is lean by design. Performant by intention.

### The Showoff - `@lyfie/luthor`

Use this when you want one-package-solution, shipping speed with polished defaults, this package does not bloat your application, it depends ONLY on Lexical packages and The Core `@lyfie/luthor-headless`.

- includes the Lexical package set it needs under the hood
- gives you presets out of the box, just plug and play
- includes and exposes all extensibility of `@lyfie/luthor-headless` under the hood
- still lets you move into deeper customization when needed

This is the practical all-in-one lane.  
QYSIQYG/WYSIWYG style, but without losing the escape hatch.

## Performance at a glance

Both packages are built for fast, responsive editing in real apps.

- `@lyfie/luthor` is intentionally super lightweight for a ready-to-ship WYSIWYG package.
- `@lyfie/luthor-headless` is even more lightweight, since it keeps runtime dependencies at zero and relies on peer dependencies for composition.

## Tree-Shaking

Tree-shaking helps keep shipped code lean:

- headless is especially tree-shake friendly because it is ESM and marks `sideEffects: false`
- preset package also tree-shakes JS imports, while stylesheet imports stay intentional

Result: you can avoid dragging unnecessary editor code into production bundles, keeping your final build as lean as possible on the users browser.

## Features Developers Might Love (I know I do)

### Writing + structure that feels solid

- typography controls
- formatting essentials
- links, headings, alignment, and list workflows

![Typography and formatting](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature1.gif)
![Links and structure](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature4.gif)
![Lists and structure](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature5.gif)

### Productivity without friction

- slash command center
- command workflows
- undo/redo and keyboard-first speed

![Slash commands](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature11.gif)
![History and shortcuts](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature10.gif)

### Real product features, not just demo features

- embeds (image, iframe, YouTube)
- code blocks
- custom blocks and extension-level flexibility
- dark/light ready behavior

![Embeds and media](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature7.gif)
![Code blocks](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature8.gif)
![Custom blocks](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature12.gif)
![Theme support](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature9.gif)

## Minimal Setup: Preset Lane

```bash
npm install @lyfie/luthor
```

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Minimal Setup: Headless Lane

```bash
npm install @lyfie/luthor-headless
```

```bash
npm install lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils
```

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>
        Bold
      </button>
      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>
        Italic
      </button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## Why Developers Stick With It

- clear split between preset workflow and headless workflow
- practical docs for getting started, presets, architecture, and API usage
- live playground to evaluate flows before integration
- feature depth that covers real product requirements, not just demos
- developer-first approach: open source, MIT, no paywalls

## Final Take

If you want a clean editor stack with zero confusion:

- choose `@lyfie/luthor-headless` for maximum UI/UX control and lean dependency strategy
- choose `@lyfie/luthor` for all the built in presets for fast QYSIQYG/WYSIWYG plug and play shipping and built-in ergonomics (bonus: you get luthor-headless features within this package too, best of both worlds)

Either way, you stay in one ecosystem and scale without redoing everything.

## Quick Links (Again)

- Website: https://www.luthor.fyi
- Playground: https://www.luthor.fyi/demo
- Docs: https://www.luthor.fyi/docs/getting-started/index
- GitHub: https://github.com/lyfie-org/luthor
- npm (`@lyfie/luthor`): https://www.npmjs.com/package/@lyfie/luthor
- npm (`@lyfie/luthor-headless`): https://www.npmjs.com/package/@lyfie/luthor-headless
