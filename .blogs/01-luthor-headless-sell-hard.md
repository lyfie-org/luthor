# Build Your Own Editor with `@lyfie/luthor-headless`

Hey devs.
If you have ever tried building a rich text editor that truly fits your product, you already know the pain.

You usually pick one:

- fast setup, but rigid UI and hacky customization
- full control, but weeks of plumbing work

I built `@lyfie/luthor-headless` to end that tradeoff.
It is a Lexical-powered, extension-first runtime for React where you own the UX, while the core logic stays clean and typed.

Quick links:

- npm: https://www.npmjs.com/package/@lyfie/luthor-headless
- docs: https://www.luthor.fyi/docs/getting-started/luthor-headless
- features: https://www.luthor.fyi/docs/luthor-headless/features
- license: https://github.com/lyfie-org/luthor/blob/main/LICENSE

![Slash command center demo](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature11.gif)

## Why this package exists

Most editor packages are either:

- opinionated UI bundles that fight your design system
- low-level building blocks with too much repeated boilerplate

`@lyfie/luthor-headless` is for teams that need product-grade control and developer velocity at the same time.

Core goals:

- type-safe commands and active states
- extension-first architecture
- JSON/Markdown/HTML bridge support
- custom nodes without architectural pain

## Fully open source, MIT licensed, free forever

This part matters just as much as the API design.

`@lyfie/luthor-headless` is published as open source under the **MIT license**.
That means:

- no paywalls for core features
- no per-seat licensing inside the package itself
- no usage restrictions for commercial products
- no requirement to open-source your app just because you use it

Standard MIT notice requirements still apply when redistributing.

As of **March 10, 2026**, the repo and package metadata both indicate MIT licensing.

For teams, this is not just a pricing detail. It is an architectural decision:

- you can adopt confidently in startups and enterprise products
- legal review is usually simpler than custom or restrictive licenses
- you avoid getting trapped behind paid feature gates later

## How this compares to common editor ecosystems

| Model | Typical tradeoff | With `@lyfie/luthor-headless` |
| --- | --- | --- |
| Commercial/tiered editor platforms | powerful features, but premium gates and pricing growth over time | full package access under MIT, no built-in paywall tiers |
| Open-core editor stacks | free base, key capabilities sold as paid add-ons | extension system is shipped openly in the package |
| Restrictive custom licenses | legal limitations on redistribution/commercial usage | permissive MIT terms |

This is exactly why I keep saying "control." It is technical control plus business-model control.

## What you get (real developer value)

- `createEditorSystem` for typed provider/hooks
- extension catalog for formatting, structure, embeds, code, productivity
- `createCustomNodeExtension` for product-specific blocks
- theme APIs: `defaultLuthorTheme`, `mergeThemes`, `createEditorThemeStyleVars`
- data bridges: `markdownToJSON`, `jsonToMarkdown`, `htmlToJSON`, `jsonToHTML`

Here is the setup pattern:

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
  slashCommandExtension,
  commandPaletteExtension,
} from "@lyfie/luthor-headless";

const extensions = [
  richTextExtension,
  boldExtension,
  italicExtension,
  slashCommandExtension,
  commandPaletteExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();
```

That tuple-driven extension list keeps your command surface aligned with what you actually install.

In practice, this also keeps your onboarding cleaner for new engineers:

- extension lists are explicit
- command availability is predictable
- custom behavior is additive, not hidden behind opaque internals

## Feature snapshot

- slash commands + command palette
- list systems, links, headings, tables, indentation
- image/iframe/YouTube embeds
- code blocks + code intelligence
- theme-friendly integration

![Code block and devtools flow](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature8.gif)

![Custom block extension capability](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature12.gif)

![Lists and structure in action](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature5.gif)

## Efficiency check (validated)

I validated package footprint locally on **March 10, 2026** using `npm pack --json`.
For headless packages, comparing only one package is misleading, because required engine packages differ.
So this table compares **top-level install sets** (KB, rounded to 1 decimal), not runtime bundle benchmarks.

| Headless stack (top-level install set) | Versions checked | Packed size (KB) |
| --- | --- | ---: |
| `@lyfie/luthor-headless` + required Lexical peer set (`lexical`, `@lexical/*` core packages) | `2.4.0` + `0.41.0` | 1,010.9 |
| Tiptap headless starter stack (`@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`) | `3.20.1` | 587.2 |
| Slate headless stack (`slate`, `slate-react`, `slate-history`) | `0.123.0` / `0.113.1` | 1,057.9 |

What I care about most here is that `@lyfie/luthor-headless` is in the same practical band as established headless stacks while giving you typed commands, extension composition, and Lexical-native workflows out of the box.

Combined with MIT licensing and no paid gates in-package, that makes it a practical default choice for teams that want both velocity and long-term freedom.

## Get started in minutes

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional:

```bash
pnpm add highlight.js @emoji-mart/data
```

## Who should use this

Use `@lyfie/luthor-headless` if:

- your editor UX must match your product, not a template
- you need typed command/state APIs that scale
- you care about clean JSON/Markdown/HTML flows
- you want Lexical power without rebuilding the same infrastructure every project
- you want an MIT-licensed editor layer with no built-in paywalls or usage restrictions

If your current editor setup feels like compromise, try this stack.
Subtle pitch, direct truth: this is the control layer most teams wish they had from day one.
