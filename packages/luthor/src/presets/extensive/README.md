# Extensive preset

The Extensive preset is the fully-loaded editor experience in `@lyfie/luthor`.
It ships with a complete UI, advanced extensions, and a scoped styling model so you can run multiple editors on the same page with predictable CSS behavior.

---

## What this preset includes

- Full formatting (inline + blocks)
- Lists, links, tables, media, HTML embeds
- Command palette, floating toolbar, context menu, draggable blocks
- Visual + HTML + Markdown modes
- Built-in light/dark editor theme toggle

---

## Installation

Install the package(s):

```bash
pnpm add @lyfie/luthor @lyfie/luthor-headless
```

Then import the shipped stylesheet at your app entry (or page entry):

```tsx
import "@lyfie/luthor/styles.css";
```

Without this import, the component will render but won’t look like the preset design.

---

## Quick start

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function Page() {
	return <ExtensiveEditor />;
}
```

---

## Styling model (important)

Extensive styles are intentionally class-scoped:

- Root wrapper: `.luthor-preset.luthor-preset-extensive.luthor-editor-wrapper`
- Rich text area classes include:
	- `.luthor-preset-extensive__container`
	- `.luthor-preset-extensive__content`
	- `.luthor-preset-extensive__placeholder`

This means you can style one preset instance without affecting other preset instances.

### Why this matters

If you render two different presets on the same page, you can target each root class independently:

```css
.luthor-preset-blog {
	--luthor-preset-accent: #7c2d12;
}

.luthor-preset-extensive {
	--luthor-accent: #2563eb;
}
```

No global `.editor`/`.toolbar` conflict is required.

---

## Default class map you can override

The component internally uses these classnames:

- Layout/header/toolbar:
	- `.luthor-editor-wrapper`
	- `.luthor-editor-header`
	- `.luthor-toolbar`, `.luthor-toolbar-button`, `.luthor-toolbar-section`
- Editing surface:
	- `.luthor-content-editable`
	- `.luthor-placeholder`
	- `.luthor-source-view`
- Feature UI:
	- `.luthor-command-palette*`
	- `.luthor-dialog*`
	- `.luthor-floating-toolbar*`
	- `.luthor-context-menu*`

For image/table internals, selectors are also scoped under `.luthor-preset-extensive`.

---

## Theming and CSS variables

Extensive defines its own CSS variables per theme using:

- `.luthor-preset-extensive.luthor-editor-wrapper[data-editor-theme="light"]`
- `.luthor-preset-extensive.luthor-editor-wrapper[data-editor-theme="dark"]`

Main variables:

- `--luthor-bg`
- `--luthor-fg`
- `--luthor-border`
- `--luthor-border-hover`
- `--luthor-accent`
- `--luthor-accent-hover`
- `--luthor-muted`
- `--luthor-muted-fg`

### Example: custom brand theme for one instance

```tsx
<ExtensiveEditor className="my-brand-editor" />
```

```css
.my-brand-editor.luthor-preset-extensive[data-editor-theme="light"] {
	--luthor-accent: #8b5cf6;
	--luthor-accent-hover: #7c3aed;
	--luthor-border: #ddd6fe;
}

.my-brand-editor .luthor-toolbar-button {
	border-radius: 10px;
}
```

Use `className` to attach per-instance overrides cleanly.

---

## Component API

### `ExtensiveEditor` props

- `className?: string`
	- Added on the root wrapper; best entry point for instance-scoped overrides.
- `onReady?: (methods: ExtensiveEditorRef) => void`
	- Receives editor methods once initialized.
- `initialTheme?: "light" | "dark"`
	- Initial UI theme.
- `defaultContent?: string`
	- Optional markdown content injected on ready.
- `showDefaultContent?: boolean`
	- Whether built-in starter content should be injected when no `defaultContent` is provided.

### `ExtensiveEditorRef` methods

- `injectMarkdown(content: string)`
- `injectHTML(content: string)`
- `getMarkdown(): string`
- `getHTML(): string`

---

## Content import/export example

```tsx
import React from "react";
import { ExtensiveEditor, type ExtensiveEditorRef } from "@lyfie/luthor";

export function EditorPage() {
	const ref = React.useRef<ExtensiveEditorRef>(null);

	return (
		<div>
			<ExtensiveEditor ref={ref} className="docs-editor" initialTheme="light" />
			<button onClick={() => ref.current?.injectMarkdown("# Hello")}>Load MD</button>
			<button onClick={() => console.log(ref.current?.getHTML())}>Print HTML</button>
		</div>
	);
}
```

---

## Deep customization patterns

## 1) Instance-level visual customization (recommended)

Set `className` and override only inside that class.

```css
.marketing-editor.luthor-preset-extensive .luthor-content-editable {
	font-size: 18px;
	line-height: 1.8;
}
```

## 2) Global Extensive customization

If all Extensive editors in your app should share one look:

```css
.luthor-preset-extensive .luthor-mode-tab {
	text-transform: uppercase;
}
```

## 3) Conditional light/dark tuning

```css
.luthor-preset-extensive[data-editor-theme="dark"] .luthor-toolbar-button {
	border-color: #3f3f46;
}
```

## 4) Feature-specific UI targeting

Command palette only:

```css
.luthor-preset-extensive .luthor-command-palette {
	border-radius: 16px;
}
```

Floating toolbar only:

```css
.luthor-preset-extensive .luthor-floating-toolbar {
	backdrop-filter: blur(6px);
}
```

---

## Running multiple presets on one page

This package is now designed for this exact use case.

Example selectors:

```css
.luthor-preset-minimal {
	--luthor-preset-accent: #334155;
}

.luthor-preset-docs {
	--luthor-preset-accent: #4338ca;
}

.luthor-preset-extensive {
	--luthor-accent: #0ea5e9;
}
```

Each preset can be themed independently without creating your own wrapper classes (though you still can).

---

## Access preset metadata and extensions

```tsx
import { extensivePreset } from "@lyfie/luthor";

const { extensions, toolbar, config, css } = extensivePreset;
```

Use this when you need to inspect or compose around the preset definition.

---

## Best practices

- Import `@lyfie/luthor/styles.css` once in your app.
- Prefer `className` + scoped selectors over global overrides.
- Override CSS variables first; only then override component rules.
- Keep overrides grouped by feature area (`toolbar`, `palette`, `content`, etc.).
- If you have multiple editors, avoid plain `.luthor-*` selectors without a preset root qualifier.

---

## Troubleshooting

### Styles not applied

- Confirm `@lyfie/luthor/styles.css` is imported.
- Confirm your bundler includes package CSS imports.

### Dark mode looks incorrect

- Ensure selectors target `[data-editor-theme="dark"]` when overriding variables.
- Avoid hard-coded light colors on shared selectors.

### Two editors affect each other

- Prefix your overrides with `.luthor-preset-extensive` or your instance `className`.
- Remove broad selectors like `.luthor-toolbar-button { ... }` unless intentionally global.
