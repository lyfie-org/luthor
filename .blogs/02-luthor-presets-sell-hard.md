# Ship a Cool Editor Fast with `@lyfie/luthor`

Hey devs.
If you have ever said "this editor integration will be quick" and then lost days on toolbar behavior, edge cases, and source mode, this post is for you.

`@lyfie/luthor` is the preset package I built to compress that effort.
You get plug-and-play editor experiences on top of `@lyfie/luthor-headless` + Lexical, with a clean path to deeper customization.

Quick links:

- npm: https://www.npmjs.com/package/@lyfie/luthor
- docs: https://www.luthor.fyi/docs/getting-started/luthor
- presets docs: https://www.luthor.fyi/docs/luthor/presets
- demo: https://www.luthor.fyi/demo
- license: https://github.com/lyfie-org/luthor/blob/main/LICENSE

![Typography and formatting quality](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature1.gif)

## Why this package exists

I wanted one package that gives teams:

- fast integration
- polished UX defaults
- no future lock-in

That is exactly the shape of `@lyfie/luthor`.
Use presets now, switch to headless APIs when requirements get custom.

## Open source and free forever (MIT, no paywalls)

`@lyfie/luthor` is not an open-core teaser.
It is an MIT-licensed package with the preset system shipped openly.

What that means for teams:

- no in-package paywalls
- no per-seat feature gates tied to preset usage
- no restrictive licensing clauses blocking commercial deployment
- no forced migration tax when your product scales

Standard MIT notice requirements still apply when redistributing.

As of **March 10, 2026**, licensing metadata in the package/repo indicates MIT.

## How this compares to other editor business models

| Model | Common reality | With `@lyfie/luthor` |
| --- | --- | --- |
| Hosted editor platforms | fast start, but recurring pricing and gated premium capabilities | installable npm package with full preset access |
| Open-core editors | free basics, paid “pro” features for serious workflows | preset capabilities shipped under MIT |
| Restrictive/custom licenses | legal friction for product usage and redistribution | permissive MIT terms |

If you care about both engineering velocity and long-term product freedom, this difference is huge.

## Get started in 60 seconds

```bash
npm install @lyfie/luthor react react-dom
```

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

You can literally ship a serious baseline editor with this.

## Preset lineup (8 included)

From `presetRegistry`, these are available today:

1. `ExtensiveEditor`
2. `ComposeEditor`
3. `SimpleEditor`
4. `LegacyRichEditor`
5. `MDEditor`
6. `HTMLEditor`
7. `SlashEditor`
8. `HeadlessEditorPreset`

## Which preset fits which use case?

- **ExtensiveEditor**: full WYSIWYG for docs/CMS/editor-heavy products
- **ComposeEditor**: focused drafting for support, email, and workflows
- **SimpleEditor**: chat or message composer with send-centric behavior
- **MDEditor / HTMLEditor**: source-aware markdown/html workflows
- **SlashEditor**: command-first writing experiences
- **HeadlessEditorPreset**: lightweight base preset for simple internal tools

![Slash command workflow](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature11.gif)

## Feature depth users can actually feel

This is not "thin wrappers over an editor core."
Across presets you get:

- typography controls
- links, lists, headings, indentation
- code blocks and source mode workflows
- rich embeds (image, iframe, YouTube)
- dark/light behavior
- undo/redo and keyboard-friendly flows

![Rich embeds in action](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature7.gif)

![Theme switching support](https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/features/Feature9.gif)

## Efficiency check (validated)

Checked locally on **March 10, 2026** via `npm pack --json`.
For plug-and-play editors, I compared **usable install sets** (KB, rounded to 1 decimal), not runtime bundle timings.
`@lyfie/luthor` itself does not require extra top-level editor packages; `highlight.js` and `@emoji-mart/data` are optional add-ons.

| Plug-and-play stack (top-level install set) | Versions checked | Packed size (KB) |
| --- | --- | ---: |
| `@lyfie/luthor` | `2.4.0` | 62.4 |
| TinyMCE React stack (`@tinymce/tinymce-react` + `tinymce`) | `6.3.0` + `8.3.2` | 2,082.7 |
| ReactQuill stack (`react-quill` + `quill`) | `2.0.0` + `2.0.3` | 818.3 |
| CKEditor React stack (`@ckeditor/ckeditor5-react` + `@ckeditor/ckeditor5-build-classic`) | `11.0.1` + `41.4.2` | 2,083.3 |

For a preset-rich package, that footprint is a strong practical balance.

And paired with MIT licensing plus no paid feature gates in the package, it removes both technical and business friction from adoption.

## No dead-end abstraction (important)

`@lyfie/luthor` also re-exports headless APIs:

```ts
import { headless } from "@lyfie/luthor";
```

So your path is clean:

- move fast with presets first
- go deeper with headless when product complexity grows

## Who should use this

Use `@lyfie/luthor` if you want to:

- ship polished editing experiences quickly
- support multiple editor modes in one package
- keep long-term flexibility without rewrite risk
- stay on an MIT-licensed stack with no in-package paywalls

Subtle pitch, direct one: start with `ExtensiveEditor`.
You will get to a "this already feels production-ready" state very quickly.
