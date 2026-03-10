# I Built a Rich Text Editor That Isn't Boring

Hey devs.
If you have ever shipped a rich text editor, you already know the truth: most solutions are either powerful and painful, or easy and boring.

I wanted neither.
So I built a Lexical-based stack designed to stay fun for users and sane for engineers.

Quick links:

- `@lyfie/luthor-headless`: https://www.npmjs.com/package/@lyfie/luthor-headless
- `@lyfie/luthor`: https://www.npmjs.com/package/@lyfie/luthor
- docs: https://www.luthor.fyi/docs/getting-started/index
- live demo: https://www.luthor.fyi/demo
- license: https://github.com/lyfie-org/luthor/blob/main/LICENSE

![Editor feature showcase](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature4.gif)

## The actual problem I was solving

Teams kept running into this exact loop:

- "We need custom editor UX" -> months of low-level setup
- "We need faster delivery" -> compromise on UX quality
- "We need clean source modes" -> messy JSON/Markdown/HTML conversions

I wanted one architecture that supports both:

- fast launch velocity
- deep product-level control

But there was one more requirement I refused to compromise on:

- fully open-source distribution
- MIT licensing
- free forever access to shipped package features
- no in-package paywalls or usage restrictions

## The two-layer approach

### Layer 1: `@lyfie/luthor-headless`

This is the runtime layer for teams that want complete control.

You compose extensions, wire your own UI, and keep typed command/state contracts.

Highlights:

- `createEditorSystem`
- extension-first composition
- custom node support
- markdown/html/json bridges
- theme utilities

### Layer 2: `@lyfie/luthor`

This is the preset layer for teams that want to ship now.

It currently includes 8 presets from `presetRegistry`:

- Extensive
- Compose
- Simple
- LegacyRich
- MD
- HTML
- Slash
- Headless preset

This gives you a clean progression:

- start fast with presets
- go deeper with headless when product requirements demand it

![Slash commands and productivity](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature11.gif)

## Why this stack "refuses to be boring"

Boring is not just visual style.
Boring is friction.

This stack focuses on interaction quality:

- slash workflows
- keyboard-first editing speed
- strong structure controls
- code and rich media support
- dark/light integration

![Code blocks and dev-focused writing](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature8.gif)

![Dark and light mode support](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature9.gif)

## Efficiency check (validated numbers)

Validated locally on **March 10, 2026** using `npm pack --json`.
To keep this sensible, I compare install **stacks**, not isolated package names.
Numbers below are package tarball sizes in KB (rounded to 1 decimal), not runtime bundle benchmarks.

### Headless stack comparison

| Headless stack (top-level install set) | Versions checked | Packed size (KB) |
| --- | --- | ---: |
| `@lyfie/luthor-headless` + required Lexical peer set (`lexical`, `@lexical/*` core packages) | `2.4.0` + `0.41.0` | 1,010.9 |
| Tiptap headless starter stack (`@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`) | `3.20.1` | 587.2 |
| Slate headless stack (`slate`, `slate-react`, `slate-history`) | `0.123.0` / `0.113.1` | 1,057.9 |

### Plug-and-play stack comparison

| Plug-and-play stack (top-level install set) | Versions checked | Packed size (KB) |
| --- | --- | ---: |
| `@lyfie/luthor` | `2.4.0` | 62.4 |
| TinyMCE React stack (`@tinymce/tinymce-react` + `tinymce`) | `6.3.0` + `8.3.2` | 2,082.7 |
| ReactQuill stack (`react-quill` + `quill`) | `2.0.0` + `2.0.3` | 818.3 |
| CKEditor React stack (`@ckeditor/ckeditor5-react` + `@ckeditor/ckeditor5-build-classic`) | `11.0.1` + `41.4.2` | 2,083.3 |

The goal was practical capability with a lean dependency footprint, not "smallest at any cost."

## Open source model: what makes this different

As of **March 10, 2026**, this stack is published under MIT (repo and package metadata).

That means you can:

- use it in commercial products
- fork and adapt it when needed
- avoid licensing surprises during scale-up

Standard MIT notice requirements still apply when redistributing.

And crucially, the package model is not "free until you need real features."

### Quick comparison

| Ecosystem pattern | Typical pain | Luthor approach |
| --- | --- | --- |
| Paid tier/editor SaaS | feature gates and recurring cost pressure | installable OSS packages, no in-package paywalls |
| Open-core libraries | advanced workflows locked behind paid add-ons | preset + headless capabilities shipped under MIT |
| Restrictive custom licenses | legal friction in product adoption | permissive MIT terms |

This is one reason teams can commit early without worrying about business-model lock-in later.

## Engineering quality matters too

This was not a weekend demo.
Current workspace snapshot includes:

- `@lyfie/luthor`: 18 test files
- `@lyfie/luthor-headless`: 9 test files
- combined: 27 test files

That consistency is why the stack is reliable for real content workflows.

## Which package should you use?

- Use `@lyfie/luthor` if you want polished preset experiences immediately.
- Use `@lyfie/luthor-headless` if you want full custom control from day one.
- Use both if you want fast delivery now and deeper flexibility later.
- Pick either with confidence if MIT licensing, open source, and no paywall-based gating matter to your roadmap.

## Final note

If your current editor feels like compromise, give this stack one sprint.
Subtle pitch, honest one: it is built to ship quickly, stay flexible, and feel good to use.
