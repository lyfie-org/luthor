export const docsIndex = [
  {
    "slug": [
      "getting-started"
    ],
    "title": "Introduction",
    "description": "What @lyfie/luthor and @lyfie/luthor-headless are, and when to use each package.",
    "content": "\n# Introduction\n\n`@lyfie/luthor` and `@lyfie/luthor-headless` solve different needs.\n\n## @lyfie/luthor\n\nUse this when you want a production-ready editor quickly.\n\n- Includes preset editors and prebuilt UI\n- Includes `@lyfie/luthor-headless` under the hood\n- Best for fast shipping with strong defaults\n\n## @lyfie/luthor-headless\n\nUse this when you want full control over UI and behavior.\n\n- Extension-first architecture\n- Bring your own toolbar and app UX\n- Best for custom product-specific editing flows\n\n## Compatibility\n\nBased on package metadata in `packages/luthor/package.json` and `packages/headless/package.json`:\n\n- React: `^18.0.0 || ^19.0.0`\n- React DOM: `^18.0.0 || ^19.0.0`\n- TypeScript/TSX: fully supported\n- Lexical:\n  - `@lyfie/luthor`: uses Lexical `^0.40.0` dependencies internally\n  - `@lyfie/luthor-headless`: peer dependency `>=0.40.0` for `lexical` and required `@lexical/*` packages\n\n## Recommended path\n\n1. [Introduction](/docs/getting-started/)\n2. [Installation](/docs/getting-started/installation/)\n3. [Contributor Guide](/docs/getting-started/contributor-guide/)\n4. [Capabilities](/docs/getting-started/capabilities/)\n5. [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/)\n6. [@lyfie/luthor](/docs/getting-started/luthor/)\n\n## Contributor deep dives\n\n- [@lyfie/luthor architecture](/docs/luthor/architecture/)\n- [@lyfie/luthor props reference](/docs/luthor/props-reference/)\n- [@lyfie/luthor feature flags](/docs/luthor/feature-flags/)\n- [@lyfie/luthor-headless architecture](/docs/luthor-headless/architecture/)\n- [@lyfie/luthor-headless extensions and API](/docs/luthor-headless/extensions-and-api/)\n- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)\n",
    "urlPath": "/docs/getting-started/",
    "sourcePath": "apps/web/src/content/docs/getting-started/index.md",
    "updatedAt": "2026-03-11T16:48:48.470Z"
  },
  {
    "slug": [
      "getting-started",
      "capabilities"
    ],
    "title": "Capabilities",
    "description": "Complete capability overview copied from the home page Why Luthor section, with package availability notes.",
    "content": "\n# Capabilities\nFor Lexical engine-level behavior and APIs, read the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).\n\n## Typography Controls\n\n![Typography controls preview](/features/Feature1.gif)\n\nCustom fonts, font size controls, and line-height that behaves. Typography should fit your product voice, not force browser defaults.\n\n- Use any custom font you want.\n- Dial in font sizes for readability.\n- Granular line-height control for cleaner rhythm.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Essentials Done Right\n\n![Text formatting essentials preview](/features/Feature2.gif)\n\nBold, italic, underline, strike, sub/superscript, code, and quotes. Core formatting is implemented cleanly and type-safe.\n\n- Bold, italic, underline, and strikethrough.\n- Subscript and superscript support.\n- Inline code and block quotes.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Color And Highlight\n\n![Color and highlight preview](/features/Feature3.gif)\n\nApply font color and highlights without inline style chaos. Color tools integrate with themes and keep output clean.\n\n- Font color support.\n- Highlight support.\n- Theme-friendly output styles.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Links And Structure\n\n![Links and structure preview](/features/Feature4.gif)\n\nPredictable links plus semantic headings and paragraph flow. Link insertion is clean, and document hierarchy stays sane.\n\n- Predictable link insertion behavior.\n- Paragraphs and headings from H1 to H6.\n- Left, center, right, and justify alignment.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Lists That Know What They're Doing\n\n![Lists preview](/features/Feature5.gif)\n\nUnordered, ordered, and checklist/task lists in one workflow. Use the right list type without fighting editor state.\n\n- Unordered lists for free-form notes.\n- Ordered lists for sequences and steps.\n- Checklist/task lists for actionable content.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Indentation Control\n\n![Indentation preview](/features/Feature6.gif)\n\nIndent in and out with consistent, structure-safe behavior. Tab behavior is predictable and respects document structure.\n\n- Tab in and tab out quickly.\n- Supports structured indentation behavior.\n- Works cleanly with nested content.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Rich Embeds\n\n![Rich embed preview](/features/Feature7.gif)\n\nEmbed images, iframes, and YouTube content with minimal friction. Paste and render rich media without bolt-on hacks.\n\n- Image embedding support.\n- Iframe embedding support.\n- YouTube embed flow.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Code Blocks\n\n![Code block preview](/features/Feature8.gif)\n\nSyntax-ready code blocks for docs, tutorials, and snippets. Code content stays structured and extendable for real product usage.\n\n- Dedicated code block support.\n- Built for developer-focused content.\n- Extensible for richer syntax experiences.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Dark/Light Ready\n\n![Theme switching preview](/features/Feature9.gif)\n\nEditor-layer theme support, not fragile visual hacks. Dark and light mode behavior is built in from the editor layer.\n\n- Theme switching support.\n- Consistent readability across themes.\n- Works with your app-level styling model.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## History + Shortcuts\n\n![Undo, redo, and shortcuts preview](/features/Feature10.gif)\n\nUndo/redo and keyboard-first interactions across core features. Move fast without relying on toolbar clicks.\n\n- Full undo and redo history.\n- Keyboard-friendly command flow.\n- Built for power-user editing speed.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Slash Command Center\n\n![Slash command preview](/features/Feature11.gif)\n\nType `/` to discover and trigger editor actions quickly. Slash commands are fast, predictable, and easy to extend.\n\n- Type `/` to reveal actions.\n- Predictable command discovery.\n- Extensible command architecture.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Custom Blocks\n\n![Custom block preview](/features/Feature12.gif)\n\nCreate custom nodes and schema extensions for product-specific UX. If defaults are not enough, the editor can be shaped around your needs.\n\n- Create custom nodes.\n- Inject product-specific blocks.\n- Extend schema behavior safely.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n",
    "urlPath": "/docs/getting-started/capabilities/",
    "sourcePath": "apps/web/src/content/docs/getting-started/capabilities.md",
    "updatedAt": "2026-03-11T16:56:13.403Z"
  },
  {
    "slug": [
      "getting-started",
      "contributor-guide"
    ],
    "title": "Contributor Guide",
    "description": "Monorepo architecture, local workflows, docs tooling, and contributor checklist for Luthor packages.",
    "content": "\n# Contributor Guide\n\nThis page is the fastest path for contributors working on `@lyfie/luthor` and `@lyfie/luthor-headless`.\n\n## Prerequisites\n\n- Node `>=20`\n- `pnpm@10.4.1`\n\n## Monorepo map\n\n- `packages/headless`: headless runtime, extension system, and JSON/Markdown/HTML bridges.\n- `packages/luthor`: preset package built on top of headless.\n- `apps/demo`: Vite playground for rapid preset QA.\n- `apps/web`: docs + marketing site (this documentation lives here).\n- `tools`: release hardening, rule contracts, size checks, and workflow scripts.\n\n## Local development commands\n\n```bash\npnpm install\npnpm dev\n```\n\nUseful checks:\n\n```bash\npnpm build\npnpm lint\npnpm check:rule-contracts\npnpm size:check\npnpm check:release-hardening\n```\n\nPackage-level tests:\n\n```bash\npnpm -C packages/headless test\npnpm -C packages/luthor test\n```\n\n## Docs workflow (`apps/web`)\n\n1. Add or edit markdown files in `apps/web/src/content/docs/**`.\n2. Keep `title` and `description` frontmatter set.\n3. Regenerate the static docs index:\n\n```bash\npnpm -C apps/web run sync:docs\n```\n\n4. If you changed content for LLM files, run:\n\n```bash\npnpm -C apps/web run sync:llms\n```\n\n5. Preview docs locally:\n\n```bash\npnpm -C apps/web run dev\n```\n\n## Where to start by topic\n\n- Preset behavior and UI composition: [/docs/luthor/architecture/](/docs/luthor/architecture/)\n- Preset props and feature gates: [/docs/luthor/props-reference/](/docs/luthor/props-reference/)\n- Headless runtime and extension API: [/docs/luthor-headless/architecture/](/docs/luthor-headless/architecture/)\n- Metadata comment bridge internals: [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)\n\n## Pull request checklist\n\n- Reproduce in `apps/demo` or `apps/web/demo` if UI-related.\n- Add or update tests in touched package when behavior changes.\n- Run `pnpm lint` and impacted package tests.\n- Run `pnpm -C apps/web run sync:docs` if docs changed.\n- Include before/after screenshots or GIFs for UX changes.\n",
    "urlPath": "/docs/getting-started/contributor-guide/",
    "sourcePath": "apps/web/src/content/docs/getting-started/contributor-guide.md",
    "updatedAt": "2026-03-11T16:46:36.713Z"
  },
  {
    "slug": [
      "getting-started",
      "installation"
    ],
    "title": "Installation",
    "description": "Install, update, and uninstall @lyfie/luthor and @lyfie/luthor-headless.",
    "content": "\n# Installation\n\nThis page covers install, update, and uninstall for both packages.\n\n## Install @lyfie/luthor\n\n```bash\nnpm install @lyfie/luthor react react-dom\n```\n\n## Install @lyfie/luthor-headless\n\n```bash\nnpm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom\n```\n\nOptional for headless:\n\n```bash\nnpm install highlight.js @emoji-mart/data\n```\n\n## Update packages\n\n```bash\nnpm update @lyfie/luthor @lyfie/luthor-headless\n```\n\n## Uninstall packages\n\n```bash\nnpm uninstall @lyfie/luthor @lyfie/luthor-headless\n```\n\nIf you installed headless peers directly and want to remove them too:\n\n```bash\nnpm uninstall lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils highlight.js @emoji-mart/data\n```\n\n## Common mistakes\n\n1. Missing Lexical peer dependencies for headless setup\n2. Missing `@lyfie/luthor/styles.css` import for presets\n3. React/Lexical version mismatch\n4. Following preset docs when implementing headless UI (or vice versa)\r\n",
    "urlPath": "/docs/getting-started/installation/",
    "sourcePath": "apps/web/src/content/docs/getting-started/installation.md",
    "updatedAt": "2026-02-24T11:35:26.965Z"
  },
  {
    "slug": [
      "getting-started",
      "luthor-headless"
    ],
    "title": "@lyfie/luthor-headless",
    "description": "Minimal setup and validation for @lyfie/luthor-headless.",
    "content": "\n# @lyfie/luthor-headless\n\nUse this when you need full control over editor UI.\n\n## Install\n\n```bash\nnpm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom\n```\n\n## Render a minimal headless editor\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  boldExtension,\n  italicExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension, boldExtension, italicExtension] as const;\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands, activeStates } = useEditor();\n\n  return (\n    <div>\n      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>\n      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Write here...\" />\n    </Provider>\n  );\n}\n```\n\n## Validate installation\n\n- Text area mounts\n- Buttons execute bold and italic commands\n- No missing peer dependency errors for Lexical packages\n\n## Learn more about Lexical\n\n`@lyfie/luthor-headless` is built on top of Lexical. For deeper engine capabilities and low-level APIs, use the official Lexical documentation: [lexical.dev/docs](https://lexical.dev/docs/intro).\n\n## Contributor docs\n\n- [Architecture](/docs/luthor-headless/architecture/)\n- [Extensions and API](/docs/luthor-headless/extensions-and-api/)\n- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)\n- [Feature groups](/docs/luthor-headless/features/)\n",
    "urlPath": "/docs/getting-started/luthor-headless/",
    "sourcePath": "apps/web/src/content/docs/getting-started/luthor-headless.md",
    "updatedAt": "2026-03-11T16:48:57.202Z"
  },
  {
    "slug": [
      "getting-started",
      "luthor"
    ],
    "title": "@lyfie/luthor",
    "description": "Minimal setup and validation for the preset package.",
    "content": "\n# @lyfie/luthor\n\nUse this when you want a ready-to-use editor quickly.\n\n## Install\n\n```bash\nnpm install @lyfie/luthor react react-dom\n```\n\n## Render a basic editor\n\n```tsx\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <ExtensiveEditor placeholder=\"Start writing...\" />;\n}\n```\n\n## Validate installation\n\n- You can type in the editor\n- Toolbar appears\n- No module resolution errors in the dev server\n\n## Contributor docs\n\n- [Architecture](/docs/luthor/architecture/)\n- [Props reference](/docs/luthor/props-reference/)\n- [Feature flags](/docs/luthor/feature-flags/)\n- [Presets](/docs/luthor/presets/)\n",
    "urlPath": "/docs/getting-started/luthor/",
    "sourcePath": "apps/web/src/content/docs/getting-started/luthor.md",
    "updatedAt": "2026-03-11T16:48:52.386Z"
  },
  {
    "slug": [
      "luthor-headless",
      "architecture"
    ],
    "title": "Architecture",
    "description": "Internal runtime model of @lyfie/luthor-headless: editor system, extension lifecycle, and conversion bridges.",
    "content": "\n# @lyfie/luthor-headless Architecture\n\n`@lyfie/luthor-headless` is a typed extension runtime on top of Lexical. It does not ship preset UI; you compose your own UI from commands and active states.\n\n## High-level runtime flow\n\n1. Define an extension array.\n2. Create a typed system with `createEditorSystem<typeof extensions>()`.\n3. Render `<Provider extensions={extensions}>`.\n4. Use `useEditor()` in your UI for `commands`, `activeStates`, `export`, and `import`.\n5. Render `<RichText />` or your own contenteditable plugin layer.\n\n## Key modules\n\n- `packages/headless/src/core/createEditorSystem.tsx`: provider and hook factory.\n- `packages/headless/src/core/createExtension.ts`: typed extension factory.\n- `packages/headless/src/extensions/**`: built-in extension catalog.\n- `packages/headless/src/core/markdown.ts` and `html.ts`: JSON <-> Markdown/HTML bridges.\n- `packages/headless/src/core/metadata-envelope.ts`: metadata comment preservation layer.\n\n## What `Provider` does\n\n- Collects Lexical nodes from all extensions (`getNodes`).\n- Registers extensions sorted by `config.initPriority` (higher first).\n- Aggregates extension commands into one typed `commands` object.\n- Aggregates async state queries into `activeStates`.\n- Renders plugins before children when `position` is `'before'`.\n- Renders plugins after children when `position` is `'after'`.\n- Exposes `export.toJSON()` and `import.fromJSON(...)`.\n\n## Extension lifecycle contract\n\nEvery extension follows the `Extension` interface:\n\n- `name`, `category`, `config`\n- `register(editor) => cleanup`\n- `getCommands(editor)`\n- `getStateQueries(editor)` (optional)\n- `getPlugins()`\n- `getNodes()` (optional)\n\nUse `createExtension(...)` for simple cases. Extend `BaseExtension` for advanced behavior.\n\n## Runtime mutation note\n\n`extensionsAPI.add/remove/reorder` is intentionally read-only at runtime and logs warnings. To change extension sets, pass a new `extensions` array to `Provider`.\n\n## Bridge architecture\n\nSource conversion is JSON-centered:\n\n- visual editor state is JSON\n- `jsonToMarkdown` and `jsonToHTML` export source\n- `markdownToJSON` and `htmlToJSON` import source\n- metadata comments preserve unsupported nodes and non-native fields\n\nRead full details:\n\n- [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)\n\n## Contributor entry points\n\n- Build new extension APIs: `packages/headless/src/extensions`\n- Update type contracts: `packages/headless/src/extensions/types.ts`\n- Adjust provider lifecycle and state behavior: `packages/headless/src/core/createEditorSystem.tsx`\n- Adjust bridge behavior: `packages/headless/src/core/markdown.ts`, `packages/headless/src/core/html.ts`, `packages/headless/src/core/metadata-envelope.ts`\n",
    "urlPath": "/docs/luthor-headless/architecture/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/architecture.md",
    "updatedAt": "2026-03-11T16:51:00.952Z"
  },
  {
    "slug": [
      "luthor-headless",
      "extensions-and-api"
    ],
    "title": "Extensions and API",
    "description": "Extension catalog and API usage for createEditorSystem, RichText, and custom extension authoring in @lyfie/luthor-headless.",
    "content": "\n# Extensions and API\n\nThis page is the contributor-facing API map for `@lyfie/luthor-headless`.\n\n## Core entry points\n\n- `createEditorSystem`\n- `createExtension`\n- `RichText` and `richTextExtension`\n- `markdownToJSON`, `jsonToMarkdown`, `htmlToJSON`, `jsonToHTML`\n- `defaultLuthorTheme`, `mergeThemes`, `createEditorThemeStyleVars`\n\n## Built-in extension catalog\n\n### Formatting and structure\n\n- `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`\n- `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`\n- `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`\n- `textColorExtension`, `textHighlightExtension`\n- `linkExtension`, `blockFormatExtension`, `listExtension`, `tabIndentExtension`\n- `codeExtension`, `codeIntelligenceExtension`\n- `horizontalRuleExtension`, `tableExtension`, `enterKeyBehaviorExtension`\n\n### Interaction and productivity\n\n- `historyExtension`\n- `commandPaletteExtension`\n- `slashCommandExtension`\n- `floatingToolbarExtension`\n- `contextMenuExtension`\n- `draggableBlockExtension`\n- `emojiExtension`\n\n### Media\n\n- `imageExtension`\n- `iframeEmbedExtension`\n- `youTubeEmbedExtension`\n\n### Custom\n\n- `createCustomNodeExtension(...)`\n- `createExtension(...)` (general-purpose extension factory)\n\n## Minimal typed setup\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  boldExtension,\n  italicExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension, boldExtension, italicExtension] as const;\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands, activeStates } = useEditor();\n  return (\n    <div>\n      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>\n      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>\n    </div>\n  );\n}\n\nexport function Editor() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Write...\" />\n    </Provider>\n  );\n}\n```\n\n## `RichText` props\n\n`RichText` and `RichTextConfig` share these core props:\n\n- `placeholder?: ReactElement | string`\n- `contentEditable?: ReactElement`\n- `className?: string`\n- `classNames?: { container?: string; contentEditable?: string; placeholder?: string }`\n- `styles?: { container?: CSSProperties; contentEditable?: CSSProperties; placeholder?: CSSProperties }`\n- `nonEditableVisualMode?: boolean`\n- `onEditIntent?: ({ clientX, clientY }) => void`\n- `errorBoundary?: React.ComponentType<{ children; onError }>`\n\nUse `nonEditableVisualMode` and `onEditIntent` when you need read-only visual mode that promotes to editable mode on user intent.\n\n## `useEditor()` context surface\n\n- `commands`\n- `activeStates`\n- `stateQueries`\n- `listeners.registerUpdate(...)`\n- `listeners.registerPaste(...)`\n- `export.toJSON()`\n- `import.fromJSON(...)`\n- `lexical` and `editor`\n- `hasExtension(name)`\n\n## Custom extension example (`createExtension`)\n\n```tsx\nimport { $createParagraphNode, $getRoot } from 'lexical';\nimport { createExtension, ExtensionCategory } from '@lyfie/luthor-headless';\n\nexport const clearDocumentExtension = createExtension({\n  name: 'clearDocument',\n  category: [ExtensionCategory.Toolbar],\n  commands: (editor) => ({\n    clearDocument: () => {\n      editor.update(() => {\n        const root = $getRoot();\n        root.clear();\n        root.append($createParagraphNode());\n      });\n    },\n  }),\n});\n```\n\n## Choosing an extension authoring style\n\n- Use `createExtension(...)` for straightforward command and plugin additions.\n- Use `BaseExtension` subclasses when you need class-level `configure(...)` behavior, richer lifecycle hooks, or custom node registration patterns.\n\n## Related pages\n\n- [/docs/luthor-headless/architecture/](/docs/luthor-headless/architecture/)\n- [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)\n- [/docs/luthor-headless/features/](/docs/luthor-headless/features/)\n",
    "urlPath": "/docs/luthor-headless/extensions-and-api/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/extensions-and-api.md",
    "updatedAt": "2026-03-11T16:48:18.885Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features"
    ],
    "title": "Features",
    "description": "Grouped feature documentation for @lyfie/luthor-headless.",
    "content": "\n# Features\n\nFeature docs are grouped to match the home page feature set.\n\n## Contributor guides\n\n- [Architecture](/docs/luthor-headless/architecture/)\n- [Extensions and API](/docs/luthor-headless/extensions-and-api/)\n- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)\n\n## Feature groups\n\n- [Typography and Text](/docs/luthor-headless/features/typography-and-text/)\n- [Structure and Lists](/docs/luthor-headless/features/structure-and-lists/)\n- [Media and Embeds](/docs/luthor-headless/features/media-and-embeds/)\n- [Code and Devtools](/docs/luthor-headless/features/code-and-devtools/)\n- [Interaction and Productivity](/docs/luthor-headless/features/interaction-and-productivity/)\n- [Customization and Theming](/docs/luthor-headless/features/customization-and-theming/)\n\nFor deeper engine-level capability details, see the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).\n\n## Base runtime\n\n```tsx\nimport { createEditorSystem, RichText, richTextExtension } from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension] as const;\nconst { Provider } = createEditorSystem<typeof extensions>();\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <RichText placeholder=\"Write here...\" />\n    </Provider>\n  );\n}\n```\n",
    "urlPath": "/docs/luthor-headless/features/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features.md",
    "updatedAt": "2026-03-11T16:49:13.114Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "code-and-devtools"
    ],
    "title": "Code and Devtools",
    "description": "Code blocks, syntax support, and markdown/json conversion tools.",
    "content": "\n# Code and Devtools\n\nThis group covers code editing and developer-facing utilities.\n\n## Included extensions and utilities\n\n- `codeExtension`\n- `codeIntelligenceExtension`\n- `codeFormatExtension`\n- `markdownToJSON`, `jsonToMarkdown`\n\n## Example: code editor setup\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  codeExtension,\n  codeIntelligenceExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension, codeExtension, codeIntelligenceExtension] as const;\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands } = useEditor();\n  return <button onClick={() => commands.insertCodeBlock?.({ language: 'ts' })}>Code Block</button>;\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Write docs with code...\" />\n    </Provider>\n  );\n}\n```\n\n## Example: markdown bridge\n\n```ts\nimport { markdownToJSON, jsonToMarkdown } from '@lyfie/luthor-headless';\n\nconst json = markdownToJSON('# Title\\n\\nSome text');\nconst markdown = jsonToMarkdown(json);\n```\r\n",
    "urlPath": "/docs/luthor-headless/features/code-and-devtools/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/code-and-devtools.md",
    "updatedAt": "2026-02-24T18:01:47.194Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "customization-and-theming"
    ],
    "title": "Customization and Theming",
    "description": "Custom nodes, theme tokens, and extension-level customization.",
    "content": "\n# Customization and Theming\n\nThis group covers custom block logic and theming APIs.\n\n## Included APIs\n\n- `createCustomNodeExtension`\n- `defaultLuthorTheme`\n- `mergeThemes`\n- `createEditorThemeStyleVars`\n\n## Example: custom extension\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  createCustomNodeExtension,\n} from '@lyfie/luthor-headless';\n\nconst calloutExtension = createCustomNodeExtension({\n  key: 'callout',\n  category: 'block',\n  nodeType: 'element',\n  createNode: ({ $createParagraphNode, $createTextNode }) => {\n    const node = $createParagraphNode();\n    node.append($createTextNode('Callout block'));\n    return node;\n  },\n});\n\nconst extensions = [richTextExtension, calloutExtension] as const;\nconst { Provider } = createEditorSystem<typeof extensions>();\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <RichText placeholder=\"Custom editor...\" />\n    </Provider>\n  );\n}\n```\n\n## Example: theme override\n\n```ts\nimport { mergeThemes, defaultLuthorTheme } from '@lyfie/luthor-headless';\n\nconst theme = mergeThemes(defaultLuthorTheme, {\n  colors: {\n    background: '#0b1020',\n    foreground: '#f8fafc',\n  },\n});\n```\r\n",
    "urlPath": "/docs/luthor-headless/features/customization-and-theming/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/customization-and-theming.md",
    "updatedAt": "2026-02-24T11:36:56.258Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "interaction-and-productivity"
    ],
    "title": "Interaction and Productivity",
    "description": "Slash commands, command palette, shortcuts, history, and contextual UI.",
    "content": "\n# Interaction and Productivity\n\nThis group covers keyboard-first and contextual workflows.\n\n## Included extensions\n\n- `historyExtension`\n- `enterKeyBehaviorExtension`\n- `commandPaletteExtension`\n- `slashCommandExtension`\n- `floatingToolbarExtension`\n- `contextMenuExtension`\n- `emojiExtension`\n- `draggableBlockExtension`\n\n## Example\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  historyExtension,\n  commandPaletteExtension,\n  slashCommandExtension,\n  draggableBlockExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [\n  richTextExtension,\n  historyExtension,\n  commandPaletteExtension,\n  slashCommandExtension,\n  draggableBlockExtension,\n] as const;\n\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands } = useEditor();\n  return (\n    <div>\n      <button onClick={() => commands.undo?.()}>Undo</button>\n      <button onClick={() => commands.redo?.()}>Redo</button>\n      <button onClick={() => commands.showCommandPalette?.()}>Palette</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Type '/' for commands...\" />\n    </Provider>\n  );\n}\n```\r\n",
    "urlPath": "/docs/luthor-headless/features/interaction-and-productivity/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/interaction-and-productivity.md",
    "updatedAt": "2026-02-24T11:36:56.257Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "media-and-embeds"
    ],
    "title": "Media and Embeds",
    "description": "Image, iframe, and YouTube embedding features.",
    "content": "\n# Media and Embeds\n\nThis group covers rich media insertion.\n\n## Included extensions\n\n- `imageExtension`\n- `iframeEmbedExtension`\n- `youTubeEmbedExtension`\n\n## Example\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  imageExtension,\n  iframeEmbedExtension,\n  youTubeEmbedExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [\n  richTextExtension,\n  imageExtension,\n  iframeEmbedExtension,\n  youTubeEmbedExtension,\n] as const;\n\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands } = useEditor();\n  return (\n    <div>\n      <button onClick={() => commands.insertImage?.({ src: '/demo/image.png', alt: 'Demo' })}>Image</button>\n      <button onClick={() => commands.insertIframe?.({ src: 'https://example.com' })}>Iframe</button>\n      <button onClick={() => commands.insertYouTube?.('dQw4w9WgXcQ')}>YouTube</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Add media...\" />\n    </Provider>\n  );\n}\n```\r\n",
    "urlPath": "/docs/luthor-headless/features/media-and-embeds/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/media-and-embeds.md",
    "updatedAt": "2026-02-24T11:36:56.254Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "structure-and-lists"
    ],
    "title": "Structure and Lists",
    "description": "Headings, links, lists, tables, and document structure tools.",
    "content": "\n# Structure and Lists\n\nThis group covers links, headings, paragraphs, lists, and table workflows.\n\n## Included extensions\n\n- `linkExtension`\n- `blockFormatExtension`\n- `listExtension`\n- `tableExtension`\n- `horizontalRuleExtension`\n- `tabIndentExtension`\n\n## List depth and marker patterns\n\n- List indentation is capped at `8` sub-indent levels (`9` total levels including top-level).\n- `ListExtension` supports `maxDepth` configuration for custom depth caps.\n- `TabIndentExtension` supports `maxListDepth` so `Tab`/`Shift+Tab` behavior can match list depth limits.\n- Depth caps apply uniformly to ordered lists, unordered lists, and checklists.\n- `listExtension` supports ordered and unordered marker patterns through:\n  - `commands.setOrderedListPattern(pattern)`\n  - `commands.setUnorderedListPattern(pattern)`\n  - `commands.setOrderedListSuffix('dot' | 'paren')`\n- Supported unordered patterns:\n  - `disc-circle-square`\n  - `arrow-diamond-disc`\n  - `square-square-square`\n  - `arrow-circle-square`\n- Checklist variants are available through:\n  - `commands.setCheckListVariant('strikethrough' | 'plain')`\n  - `strikethrough`: checked items render with line-through text.\n  - `plain`: checked items keep normal text without line-through.\n- Checklist variant and unordered marker pattern tokens are stored on list/list-item styles, so imported JSON can be rehydrated with `commands.rehydrateListStyles()`.\n\n### Depth configuration example\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  ListExtension,\n  TabIndentExtension,\n} from '@lyfie/luthor-headless';\n\nconst MAX_SUB_INDENT = 5;\nconst maxDepth = MAX_SUB_INDENT + 1; // include top-level\n\nconst extensions = [\n  new ListExtension({ maxDepth }),\n  new TabIndentExtension({ maxListDepth: maxDepth }),\n] as const;\n\nconst { Provider } = createEditorSystem<typeof extensions>();\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <RichText placeholder=\"Write...\" />\n    </Provider>\n  );\n}\n```\n\n## Example\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  linkExtension,\n  blockFormatExtension,\n  listExtension,\n  tableExtension,\n  horizontalRuleExtension,\n  tabIndentExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [\n  richTextExtension,\n  linkExtension,\n  blockFormatExtension,\n  listExtension,\n  tableExtension,\n  horizontalRuleExtension,\n  tabIndentExtension,\n] as const;\n\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands } = useEditor();\n  return (\n    <div>\n      <button onClick={() => commands.toggleUnorderedList?.()}>Bullets</button>\n      <button onClick={() => commands.toggleOrderedList?.()}>Numbers</button>\n      <button onClick={() => commands.insertLink?.('https://example.com')}>Link</button>\n      <button onClick={() => commands.insertTable?.({ rows: 3, columns: 3 })}>3x3 Table</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Structure your document...\" />\n    </Provider>\n  );\n}\n```\r\n",
    "urlPath": "/docs/luthor-headless/features/structure-and-lists/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/structure-and-lists.md",
    "updatedAt": "2026-03-04T19:44:41.978Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features",
      "typography-and-text"
    ],
    "title": "Typography and Text",
    "description": "Fonts, line-height, and text-formatting capabilities.",
    "content": "\n# Typography and Text\n\nThis group covers typography, essentials, and color controls.\n\n## Included extensions\n\n- `boldExtension`, `italicExtension`, `underlineExtension`, `strikethroughExtension`\n- `subscriptExtension`, `superscriptExtension`, `codeFormatExtension`\n- `fontFamilyExtension`, `fontSizeExtension`, `lineHeightExtension`\n- `textColorExtension`, `textHighlightExtension`\n\n## Example\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  boldExtension,\n  italicExtension,\n  underlineExtension,\n  fontFamilyExtension,\n  fontSizeExtension,\n  lineHeightExtension,\n  textColorExtension,\n  textHighlightExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [\n  richTextExtension,\n  boldExtension,\n  italicExtension,\n  underlineExtension,\n  fontFamilyExtension,\n  fontSizeExtension,\n  lineHeightExtension,\n  textColorExtension,\n  textHighlightExtension,\n] as const;\n\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands, activeStates } = useEditor();\n  return (\n    <div>\n      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>\n      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>\n      <button onClick={() => commands.setTextColor?.('#2563eb')}>Blue</button>\n      <button onClick={() => commands.setTextHighlight?.('#fef08a')}>Highlight</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Type styled content...\" />\n    </Provider>\n  );\n}\n```\n\n## Relevant props\n\n- `RichText.placeholder`: `undefined (default) | string`\n- `RichText.disabled`: `false (default) | true`\r\n\r\n",
    "urlPath": "/docs/luthor-headless/features/typography-and-text/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features/typography-and-text.md",
    "updatedAt": "2026-02-24T11:50:02.707Z"
  },
  {
    "slug": [
      "luthor-headless",
      "metadata-comment-system"
    ],
    "title": "Metadata Comment System",
    "description": "How luthor metadata envelopes preserve unsupported and non-native data across JSON, Markdown, and HTML bridges.",
    "content": "\n# Metadata Comment System\n\nWhen converting between editor JSON and Markdown or HTML, not every node or field can be represented natively.  \n`@lyfie/luthor-headless` preserves that data using metadata envelopes encoded as HTML comments.\n\n## Envelope format\n\nComments are appended to source output:\n\n```html\n<!-- luthor:meta v1 {\"id\":\"featureCard:1:1\",\"type\":\"featureCard\",\"path\":[1],\"node\":{\"type\":\"featureCard\",\"version\":1,\"payload\":{\"title\":\"AI Draft\"}},\"fallback\":\"[Unsupported featureCard preserved in markdown metadata]\"} -->\n```\n\nSource implementation:\n\n- `packages/headless/src/core/metadata-envelope.ts`\n\n## Export pipeline (`jsonToMarkdown` and `jsonToHTML`)\n\n1. `prepareDocumentForBridge(...)` sanitizes the JSON for source-safe conversion.\n2. Unsupported node types are replaced with fallback text and stored in envelopes.\n3. Supported nodes with non-native fields generate patch envelopes.\n4. The converter builds markdown or html from sanitized JSON.\n5. `appendMetadataEnvelopes(...)` appends envelopes as `<!-- luthor:meta v1 ... -->`.\n\n## Import pipeline (`markdownToJSON` and `htmlToJSON`)\n\n1. `extractMetadataEnvelopes(...)` strips and parses envelope comments.\n2. Markdown or HTML content is converted to base JSON.\n3. `rehydrateDocumentFromEnvelopes(...)` restores preserved data.\n\n## Why two restoration strategies exist\n\n- `replace`: for unsupported node types. The original node is restored by path.\n- `merge`: for supported node types where extra metadata must be patched back onto native fields.\n\n## Markdown-specific behavior\n\n`markdown.ts` intentionally keeps markdown-editable fields native (for example image alt text and embed captions) while storing non-native extras in merge envelopes. This supports manual markdown edits without losing richer metadata.\n\nLegacy comments are still supported for backwards compatibility:\n\n- `<!-- luthor:iframe {...} -->`\n- `<!-- luthor:youtube {...} -->`\n\n## Safety guarantees\n\n- Unknown envelope versions are ignored with warnings.\n- Malformed JSON payloads are ignored safely.\n- Envelopes missing required fields are ignored.\n- Import continues with valid content even when some envelopes are invalid.\n\n## Contributor rules\n\n- If you add a new node type with non-native fields, update supported-type sets and patch extraction logic in both `markdown.ts` and `html.ts`.\n- Keep `ENVELOPE_VERSION` stable unless the format truly changes.\n- Add round-trip tests in `packages/headless/src/core/metadata-envelope.test.ts`, `packages/headless/src/core/markdown.test.ts`, and `packages/headless/src/core/html.test.ts`.\n\n## Debugging checklist\n\n1. Export JSON to markdown or html and confirm `luthor:meta v1` comments appear when expected.\n2. Edit source manually and re-import.\n3. Verify metadata fields survive round-trip.\n4. Check console warnings for ignored or malformed envelopes.\n\n## Preset impact\n\n`LegacyRichEditor`, `MDEditor`, `HTMLEditor`, and `HeadlessEditorPreset` in `@lyfie/luthor` disable many metadata-heavy features by default to keep source workflows predictable.\n",
    "urlPath": "/docs/luthor-headless/metadata-comment-system/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/metadata-comment-system.md",
    "updatedAt": "2026-03-11T16:50:16.406Z"
  },
  {
    "slug": [
      "luthor",
      "architecture"
    ],
    "title": "Architecture",
    "description": "How @lyfie/luthor is structured internally, how presets compose headless extensions, and where to contribute.",
    "content": "\n# @lyfie/luthor Architecture\n\n`@lyfie/luthor` is a preset layer on top of `@lyfie/luthor-headless`. It packages curated extension bundles, ready-made UI, and source-mode workflows.\n\n## High-level flow\n\n1. A preset component (for example `ExtensiveEditor`) resolves feature flags and options.\n2. The preset builds an extension array with `createExtensiveExtensions(...)`.\n3. It mounts a typed headless `Provider` created with `createEditorSystem(...)`.\n4. UI components (toolbar, tabs, source panel, slash/palette overlays) call typed editor commands.\n5. Source modes convert through `jsonToMarkdown` / `markdownToJSON` and `jsonToHTML` / `htmlToJSON`.\n\n## Key directories\n\n- `packages/luthor/src/presets/extensive`: base preset, extension assembly, and default UX.\n- `packages/luthor/src/presets/*`: wrappers around `ExtensiveEditor` (Compose, Simple, Slash, MD, HTML, Legacy, Headless preset).\n- `packages/luthor/src/presets/_shared`: shared preset policy, feature guards, mode cache, and style-var helpers.\n- `packages/luthor/src/core`: reusable UI pieces (toolbar, command palette, slash menu, source view, command registry, shortcut system).\n\n## Preset composition model\n\n1. `ExtensiveEditor` is the base runtime.\n2. Wrapper presets set constrained `availableModes`.\n3. Wrapper presets apply preset defaults and optional overrides via `featureFlags`.\n4. Wrapper presets optionally enforce fixed flags with `PresetFeaturePolicy`.\n5. Wrapper presets tune toolbar layouts and class names.\n\nThis keeps behavior centralized while allowing focused preset surfaces.\n\n## Feature policy model\n\n`PresetFeaturePolicy` merges:\n\n1. preset defaults,\n2. user overrides,\n3. enforced flags (cannot be turned back on).\n\nThis is why presets such as `LegacyRichEditor` keep metadata-heavy features disabled even when overrides are passed.\n\n## Source mode behavior\n\n`ExtensiveEditor` supports:\n\n- visual modes: `visual-editor`, `visual-only`, plus the legacy alias `visual`\n- source modes: `json`, `markdown`, `html`\n\nSource values are synchronized and validated on mode switches. Conversion errors are isolated to source mode and do not silently overwrite visual content.\n\n## Extension and theme wiring\n\n- Extensions are memoized from normalized config keys to avoid stale editor wiring.\n- Theme tokens use `createEditorThemeStyleVars(...)` plus CSS custom properties.\n- `defaultSettings` maps common style values (font, list marker, quote, table, placeholder, code block, toolbar) to CSS vars.\n\n## Contributor entry points\n\n- Add new preset behavior: `packages/luthor/src/presets/extensive/ExtensiveEditor.tsx`\n- Add or adjust feature flags: `packages/luthor/src/presets/extensive/extensions.tsx`\n- Add shared preset utilities: `packages/luthor/src/presets/_shared`\n- Add commands and shortcuts: `packages/luthor/src/core/commands.ts`\n",
    "urlPath": "/docs/luthor/architecture/",
    "sourcePath": "apps/web/src/content/docs/luthor/architecture.md",
    "updatedAt": "2026-03-11T16:49:50.265Z"
  },
  {
    "slug": [
      "luthor",
      "feature-flags"
    ],
    "title": "Feature Flags",
    "description": "Complete feature-flag model for @lyfie/luthor presets, including defaults, overrides, and preset enforcement.",
    "content": "\n# Feature Flags\n\n`@lyfie/luthor` uses feature flags to compose preset capability without forking runtime logic.\n\n## Source of truth\n\nCanonical keys are defined in `packages/luthor/src/presets/extensive/extensions.tsx` as `EXTENSIVE_FEATURE_KEYS`.\n\n```ts\ntype FeatureFlag =\n  | 'bold'\n  | 'italic'\n  | 'underline'\n  | 'strikethrough'\n  | 'fontFamily'\n  | 'fontSize'\n  | 'lineHeight'\n  | 'textColor'\n  | 'textHighlight'\n  | 'subscript'\n  | 'superscript'\n  | 'link'\n  | 'horizontalRule'\n  | 'table'\n  | 'list'\n  | 'history'\n  | 'image'\n  | 'blockFormat'\n  | 'code'\n  | 'codeIntelligence'\n  | 'codeFormat'\n  | 'tabIndent'\n  | 'enterKeyBehavior'\n  | 'iframeEmbed'\n  | 'youTubeEmbed'\n  | 'floatingToolbar'\n  | 'contextMenu'\n  | 'commandPalette'\n  | 'slashCommand'\n  | 'emoji'\n  | 'draggableBlock'\n  | 'customNode'\n  | 'themeToggle';\n```\n\n## Default behavior\n\n`ExtensiveEditor` defaults to all flags enabled (`DEFAULT_FEATURE_FLAGS`).\n\nDisable selectively:\n\n```tsx\n<ExtensiveEditor\n  featureFlags={{\n    image: false,\n    table: false,\n    customNode: false,\n    commandPalette: false,\n  }}\n/>\n```\n\n## Preset enforcement\n\nSome presets hard-enforce specific flags:\n\n- `LegacyRichEditor`: enforces metadata-heavy features off (table, image, embeds, custom nodes, draggable, palette/slash, emoji, theme toggle).\n- `SlashEditor`: enforces `slashCommand: true` and `commandPalette: false`.\n- `HeadlessEditorPreset`: enforces a lightweight metadata-free profile.\n- `SimpleEditor`: hardcodes a minimal visual-only feature set for message input.\n\n## Why enforcement exists\n\nPreset contracts must stay stable. If a preset promises metadata-free markdown/html workflows or slash-first behavior, enforced flags prevent accidental contract drift.\n\n## Feature groups\n\n- Typography: `fontFamily`, `fontSize`, `lineHeight`\n- Inline formatting: `bold`, `italic`, `underline`, `strikethrough`, `subscript`, `superscript`, `codeFormat`, `textColor`, `textHighlight`\n- Document structure: `blockFormat`, `list`, `horizontalRule`, `table`, `tabIndent`, `enterKeyBehavior`\n- Rich content: `image`, `iframeEmbed`, `youTubeEmbed`, `customNode`\n- Productivity UI: `history`, `commandPalette`, `slashCommand`, `floatingToolbar`, `contextMenu`, `draggableBlock`, `themeToggle`, `emoji`\n- Code workflows: `code`, `codeIntelligence`\n\n## Contributor rules\n\n- Add new flags only in `EXTENSIVE_FEATURE_KEYS`.\n- Reflect the flag in `DEFAULT_FEATURE_FLAGS`.\n- Wire the flag into extension assembly in `buildExtensiveExtensions(...)`.\n- Update preset-specific policies if needed.\n- Update docs that describe preset behavior.\n",
    "urlPath": "/docs/luthor/feature-flags/",
    "sourcePath": "apps/web/src/content/docs/luthor/feature-flags.md",
    "updatedAt": "2026-03-11T16:47:11.504Z"
  },
  {
    "slug": [
      "luthor",
      "presets"
    ],
    "title": "Presets",
    "description": "Preset catalog for @lyfie/luthor, including per-preset docs.",
    "content": "\n# Presets\n\n`@lyfie/luthor` is a preset package built on top of `@lyfie/luthor-headless`.\n\n## Contributor guides\n\n- [Architecture](/docs/luthor/architecture/)\n- [Props reference](/docs/luthor/props-reference/)\n- [Feature flags](/docs/luthor/feature-flags/)\n\n## Importing headless from presets package\n\n```ts\nimport { headless } from '@lyfie/luthor';\n```\n\n## Preset docs\n\n- [Extensive Editor](/docs/luthor/presets/extensive-editor/)\n- [Compose Editor](/docs/luthor/presets/compose-editor/)\n- [Simple Editor](/docs/luthor/presets/simple-editor/)\n- [Legacy Rich Editor](/docs/luthor/presets/legacy-rich-editor/)\n- [MD Editor](/docs/luthor/presets/md-editor/)\n- [HTML Editor](/docs/luthor/presets/html-editor/)\n- [Slash Editor](/docs/luthor/presets/slash-editor/)\n- [Headless Editor](/docs/luthor/presets/headless-editor-preset/)\n",
    "urlPath": "/docs/luthor/presets/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets.md",
    "updatedAt": "2026-03-11T16:49:08.698Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "compose-editor"
    ],
    "title": "Compose Editor",
    "description": "Focused rich text drafting preset with a compact, practical toolbar.",
    "content": "\n# Compose Editor\n\n`ComposeEditor` merges focused rich-text and draft-composition workflows into one surface.\n\nUse it as a clean rich editor with a constrained feature set for practical drafting flows.\n\n## Usage\n\n```tsx\nimport { ComposeEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return (\n    <ComposeEditor\n      compactToolbar\n      placeholder=\"Write your draft...\"\n    />\n  );\n}\n```\n\n## Props\n\n`ComposeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.\n\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides`\n- `compactToolbar`: `false (default) | true`\n\n## Behavior\n\n- Defaults to focused formatting with media/embed-heavy features disabled.\n- Supports feature flag overrides for deeper tuning.\n\r\n",
    "urlPath": "/docs/luthor/presets/compose-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/compose-editor.md",
    "updatedAt": "2026-03-10T09:20:33.164Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "extensive-editor"
    ],
    "title": "Extensive Editor",
    "description": "Full-feature preset and core prop reference.",
    "content": "\n# Extensive Editor\n\n`ExtensiveEditor` is the base full-feature preset editor.\n\n## Usage\n\n```tsx\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <ExtensiveEditor placeholder=\"Write anything...\" />;\n}\n```\n\n## Core props\n\n- `initialTheme`: `'light' (default) | 'dark'`\n- `onThemeChange`: `(theme: 'light' | 'dark') => void`\n- `showDefaultContent`: `true (default) | false`\n- `placeholder`: `'Write anything...' (default) | string | { visual?: string; json?: string; markdown?: string; html?: string }`\n- `initialMode`: `'visual-editor' (default) | 'visual-only' | 'visual' (legacy alias) | 'json' | 'markdown' | 'html'`\n- `availableModes`: `['visual-editor', 'visual-only', 'json', 'markdown', 'html'] (default) | ExtensiveEditorMode[]`\n- `toolbarPosition`: `'top' (default) | 'bottom'`\n- `toolbarAlignment`: `'left' (default) | 'center' | 'right'`\n- `isToolbarEnabled`: `true (default) | false`\n- `minimumDefaultLineHeight`: `1.5 (default) | string | number`\n- `scaleByRatio`: `false (default) | true`\n- `syncHeadingOptionsWithCommands`: `true (default) | false`\n- `commandPaletteShortcutOnly`: `false (default) | true`\n- `editOnClick`: `true (default) | false` (in `visual-only` mode, click jumps into editable `visual-editor` mode at click/nearest line)\n- `isCopyAllowed`: `true (default) | false`\n- `syntaxHighlighting`: `'auto' | 'disabled'` | extension default behavior if omitted\n- `maxListIndentation`: `8 (default) | number` (sub-indent levels below root)\n\n## Lists in Extensive\n\n- Ordered, unordered, and checklist styles are implemented in `@lyfie/luthor-headless` and surfaced in the preset toolbar.\n- `maxListIndentation` applies to all list types (ordered, unordered, checklist), including `Tab` and command-based indentation.\n- Checklist supports two variants:\n  - `strikethrough` (default): checked items render line-through text.\n  - `plain`: checked items do not strike through text.\n\n## Theme callback example (`highlight.js`)\n\nUse `onThemeChange` when host styling must follow the editor's internal theme state (for example, swapping `highlight.js` light/dark styles).\n\n```tsx\n'use client';\n\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport { useEffect, useState } from 'react';\n\ntype Theme = 'light' | 'dark';\nconst HIGHLIGHT_THEME_LINK_ID = 'luthor-highlightjs-theme';\n\nexport function EditorWithHighlightTheme() {\n  const [editorTheme, setEditorTheme] = useState<Theme>('light');\n\n  useEffect(() => {\n    const href =\n      editorTheme === 'dark'\n        ? '/highlightjs/github-dark.css'\n        : '/highlightjs/github.css';\n\n    const existing = document.getElementById(HIGHLIGHT_THEME_LINK_ID);\n    const link =\n      existing instanceof HTMLLinkElement\n        ? existing\n        : document.createElement('link');\n\n    if (!(existing instanceof HTMLLinkElement)) {\n      link.id = HIGHLIGHT_THEME_LINK_ID;\n      link.rel = 'stylesheet';\n      document.head.appendChild(link);\n    }\n\n    if (link.href !== new URL(href, window.location.origin).href) {\n      link.href = href;\n    }\n  }, [editorTheme]);\n\n  return (\n    <ExtensiveEditor\n      initialTheme=\"light\"\n      onThemeChange={setEditorTheme}\n      toolbarAlignment=\"center\"\n    />\n  );\n}\n```\n\nPlace these files in your app static assets:\n\n- `/public/highlightjs/github.css`\n- `/public/highlightjs/github-dark.css`\n\n## Ref API\n\n- `injectJSON(content: string): void`\n- `getJSON(): string`\n\n## Notes\n\nThis is the base preset that other presets build on.\r\n\r\n\r\n\r\n\r\n",
    "urlPath": "/docs/luthor/presets/extensive-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/extensive-editor.md",
    "updatedAt": "2026-03-11T08:26:57.768Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "headless-editor-preset"
    ],
    "title": "Headless Editor",
    "description": "Reference preset showing direct headless composition.",
    "content": "\n# Headless Editor\n\nBasic rich-text preset with lightweight defaults and source tabs.\n\n## Usage\n\n```tsx\nimport { HeadlessEditorPreset } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <HeadlessEditorPreset defaultEditorView=\"visual\" />;\n}\n```\n\n## Props\n\n`HeadlessEditorPresetProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.\n\n- `initialMode`: `'visual' (default) | 'json' | 'markdown' | 'html'`\n- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown' | 'html'`\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)\n\n## Behavior\n\nUses a text-pill toolbar (bold/italic/strike/inline code, block controls, lists, code block, quote, HR, hard break, undo/redo), supports Visual/JSON/MD/HTML tabs, and keeps draggable blocks plus metadata-heavy features disabled.\n\r\n\r\n",
    "urlPath": "/docs/luthor/presets/headless-editor-preset/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/headless-editor-preset.md",
    "updatedAt": "2026-03-10T07:42:04.234Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "html-editor"
    ],
    "title": "HTML Editor",
    "description": "Visual and HTML-focused preset with constrained markdown/html-native features.",
    "content": "\n# HTML Editor\n\nHTML-focused preset with visual editing plus JSON/HTML source tabs.\n\nInternally this preset is a `LegacyRichEditor` wrapper with `sourceFormat=\"html\"`.\n\n## Usage\n\n```tsx\nimport { HTMLEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <HTMLEditor defaultEditorView=\"html\" />;\n}\n```\n\n## Props\n\n`HTMLEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.\n\n- `initialMode`: `'visual' (default) | 'json' | 'html'`\n- `defaultEditorView`: `'visual' (default) | 'json' | 'html'`\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)\n\n## Behavior\n\nProvides markdown/html-native formatting (headings, lists, links, quote, inline code, code block, horizontal rule), uses Visual/JSON/HTML tabs, keeps toolbar enabled, and disables draggable blocks plus metadata-heavy features like embeds, media, and custom nodes.\n",
    "urlPath": "/docs/luthor/presets/html-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/html-editor.md",
    "updatedAt": "2026-03-10T07:10:02.454Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "legacy-rich-editor"
    ],
    "title": "Legacy Rich Editor",
    "description": "Shared metadata-free rich editor profile powering both MD and HTML presets.",
    "content": "\n# Legacy Rich Editor\n\n`LegacyRichEditor` is a shared metadata-free editor profile that powers both `MDEditor` and `HTMLEditor`.\n\nUse it when you want the same native feature set and switch only the source tab mode between markdown and html.\n\n## Usage\n\n```tsx\nimport { LegacyRichEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return (\n    <LegacyRichEditor\n      defaultEditorView=\"markdown\"\n    />\n  );\n}\n```\n\n## Props\n\n`LegacyRichEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.\n\n- `sourceFormat`: `'both' (default) | 'markdown' | 'html'`\n- `initialMode`: `'visual' (default) | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)\n- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown' | 'html'` (validated against `sourceFormat`)\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (metadata-heavy features remain disabled)\n\n## Behavior\n\n- Shared native profile:\n  - headings, paragraph, quote\n  - bold, italic, strikethrough, inline code\n  - code block\n  - links\n  - ordered/unordered/check lists + indentation\n  - horizontal rule\n- Disabled to keep metadata-free round trips:\n  - tables, images, embeds, custom nodes, draggable block, emoji, slash/command palette, theme toggle\n- Source views:\n  - `sourceFormat=\"both\"` uses Visual/Markdown/HTML tabs\n  - `sourceFormat=\"markdown\"` uses Visual/JSON/Markdown tabs\n  - `sourceFormat=\"html\"` uses Visual/JSON/HTML tabs\n",
    "urlPath": "/docs/luthor/presets/legacy-rich-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/legacy-rich-editor.md",
    "updatedAt": "2026-03-10T09:35:26.423Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "md-editor"
    ],
    "title": "MD Editor",
    "description": "Visual and markdown mode preset with mode-switch behavior.",
    "content": "\n# MD Editor\n\nMarkdown-native preset with visual editing plus JSON/Markdown source tabs.\n\nInternally this preset is a `LegacyRichEditor` wrapper with `sourceFormat=\"markdown\"`.\n\n## Usage\n\n```tsx\nimport { MDEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <MDEditor defaultEditorView=\"markdown\" />;\n}\n```\n\n## Props\n\n`MDEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`, `availableModes`, and source-view mode props, then re-adds constrained mode variants.\n\n- `initialMode`: `'visual' (default) | 'json' | 'markdown'`\n- `defaultEditorView`: `'visual' (default) | 'json' | 'markdown'`\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides` (preset-enforced exclusions still apply)\n\n## Behavior\n\nProvides markdown-native formatting (headings, lists, links, quote, inline code, code block, horizontal rule), uses Visual/JSON/Markdown tabs, keeps toolbar enabled, and disables draggable blocks plus metadata-heavy features like embeds, media, and custom nodes.\n\r\n",
    "urlPath": "/docs/luthor/presets/md-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/md-editor.md",
    "updatedAt": "2026-03-10T09:21:49.299Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "simple-editor"
    ],
    "title": "Simple Editor",
    "description": "Constrained message editor preset with send controls.",
    "content": "\n# Simple Editor\n\n`SimpleEditor` is a constrained message-editor preset.\n\nIt keeps formatting intentionally minimal and supports send workflows out of the box.\n\n## Usage\n\n```tsx\nimport { SimpleEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return (\n    <SimpleEditor\n      placeholder=\"Type a message\"\n      submitOnEnter\n      allowShiftEnter\n      outputFormat=\"md\"\n      onSend={({ text }) => {\n        console.log(text);\n      }}\n    />\n  );\n}\n```\n\n## Props\n\n`SimpleEditorProps` is purpose-built for message input.\n\n- `formattingOptions`: `SimpleFormattingOptions`\n- `onSend`: `(payload: SimpleEditorSendPayload) => void`\n- `outputFormat`: `'md' (default) | 'json'`\n- `submitOnEnter`: `false (default) | true`\n- `allowShiftEnter`: `true (default) | false`\n- `showBottomToolbar`: `true (default) | false`\n- `toolbarButtons`: `readonly SimpleToolbarButton[]`\n- `sendButtonPlacement`: `'inside' (default) | 'right'`\n- `minHeight` / `maxHeight` / `minWidth` / `maxWidth`\n\n## Behavior\n\n- Allows only bold, italic, and strikethrough formatting.\n- Always runs visual mode only.\n- Supports auto-grow until `maxHeight`, then internal scrolling.\r\n\r\n",
    "urlPath": "/docs/luthor/presets/simple-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/simple-editor.md",
    "updatedAt": "2026-03-10T09:20:43.227Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "slash-editor"
    ],
    "title": "Slash Editor",
    "description": "Slash-first preset with draggable and command-focused defaults.",
    "content": "\n# Slash Editor\n\nSlash-first preset with draggable-focused defaults.\n\n## Usage\n\n```tsx\nimport { SlashEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <SlashEditor showDefaultContent={false} />;\n}\n```\n\n## Props\n\n`SlashEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`, then re-adds both.\n\n- `slashVisibility`: `undefined (default) | SlashCommandVisibility`\n- `isDraggableEnabled`: `true (default) | false`\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides`\n- `isToolbarEnabled`: `false (default) | true`\n\n## Behavior\n\nDefaults keep toolbar hidden, enable draggable blocks in visual editor mode, and provide a curated slash-command list for basic editing actions (headings, lists, quote, code block, inline code, bold/italic, links, horizontal rule, table) across Visual/JSON/Markdown/HTML tabs.\n\r\n",
    "urlPath": "/docs/luthor/presets/slash-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/slash-editor.md",
    "updatedAt": "2026-03-11T13:52:06.880Z"
  },
  {
    "slug": [
      "luthor",
      "props-reference"
    ],
    "title": "Props Reference",
    "description": "Contributor-level prop reference for ExtensiveEditor and all preset wrappers in @lyfie/luthor.",
    "content": "\n# Props Reference\n\nThis page explains how preset props are layered. Most wrappers inherit `ExtensiveEditorProps` and then constrain modes or features.\n\n## 1) `ExtensiveEditorProps` (base preset)\n\n### Content and mode\n\n- `defaultContent?: string`\n- `showDefaultContent?: boolean` (default `true`)\n- `placeholder?: string | { visual?: string; json?: string; markdown?: string; html?: string }`\n- `initialMode?: 'visual-only' | 'visual-editor' | 'visual' | 'json' | 'markdown' | 'html'`\n- `defaultEditorView?: same as initialMode`\n- `availableModes?: readonly ExtensiveEditorMode[]`\n- `isEditorViewTabsVisible?: boolean`\n- `isEditorViewsTabVisible?: boolean` (legacy alias)\n\n### Toolbar and command UI\n\n- `isToolbarEnabled?: boolean` (default `true`)\n- `toolbarPosition?: 'top' | 'bottom'`\n- `toolbarAlignment?: 'left' | 'center' | 'right'`\n- `toolbarLayout?: ToolbarLayout`\n- `toolbarVisibility?: ToolbarVisibility`\n- `toolbarClassName?: string`\n- `toolbarStyleVars?: ToolbarStyleVars`\n- `isToolbarPinned?: boolean`\n- `slashCommandVisibility?: SlashCommandVisibility`\n- `commandPaletteShortcutOnly?: boolean`\n- `shortcutConfig?: ShortcutConfig`\n\n### Features and editing behavior\n\n- `featureFlags?: FeatureFlagOverrides`\n- `editOnClick?: boolean` (visual-only to visual-editor promotion on click)\n- `isDraggableBoxEnabled?: boolean` (mapped into draggable feature flag)\n- `syncHeadingOptionsWithCommands?: boolean`\n- `headingOptions?: readonly ('h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')[]`\n- `paragraphLabel?: string`\n- `isCopyAllowed?: boolean`\n\n### Theme and style\n\n- `initialTheme?: 'light' | 'dark'`\n- `onThemeChange?: (theme: 'light' | 'dark') => void`\n- `theme?: Partial<LuthorTheme>`\n- `editorThemeOverrides?: LuthorEditorThemeOverrides`\n- `quoteClassName?: string`\n- `quoteStyleVars?: QuoteStyleVars`\n- `defaultSettings?: DefaultSettings`\n- `className?: string`\n- `variantClassName?: string`\n\n### Typography and code options\n\n- `fontFamilyOptions?: readonly FontFamilyOption[]`\n- `fontSizeOptions?: readonly FontSizeOption[]`\n- `lineHeightOptions?: readonly LineHeightOption[]`\n- `minimumDefaultLineHeight?: string | number`\n- `scaleByRatio?: boolean`\n- `syntaxHighlighting?: 'auto' | 'disabled'`\n- `codeHighlightProvider?: CodeHighlightProvider | null`\n- `loadCodeHighlightProvider?: () => Promise<CodeHighlightProvider | null>`\n- `maxAutoDetectCodeLength?: number`\n- `languageOptions?: readonly string[] | CodeLanguageOptionsConfig`\n- `maxListIndentation?: number` (sub-indent depth)\n\n### Lifecycle and ref\n\n- `onReady?: (methods: ExtensiveEditorRef) => void`\n- Ref methods: `injectJSON(content: string): void` and `getJSON(): string`\n\n## 2) Preset-specific additions\n\n### `ComposeEditorProps`\n\nInherits `ExtensiveEditorProps` (except direct `featureFlags`), then adds:\n\n- `featureFlags?: FeatureFlagOverrides`\n- `compactToolbar?: boolean`\n\nDefault modes are constrained to `['visual', 'json']` and media or metadata-heavy features are disabled by default.\n\n### `SimpleEditorProps`\n\nPurpose-built message input wrapper.\n\n- `formattingOptions?: { bold?: boolean; italic?: boolean; strikethrough?: boolean }`\n- `onSend?: (payload: SimpleEditorSendPayload) => void`\n- `outputFormat?: 'md' | 'json'`\n- `clearOnSend?: boolean`\n- `submitOnEnter?: boolean`\n- `allowShiftEnter?: boolean`\n- `minHeight | maxHeight | minWidth | maxWidth`\n- `toolbarButtons?: readonly SimpleToolbarButton[]`\n- `showBottomToolbar?: boolean`\n- `showSendButton?: boolean`\n- `sendButtonPlacement?: 'inside' | 'right'`\n\n### `LegacyRichEditorProps`\n\nInherits `ExtensiveEditorProps` but constrains source and mode behavior:\n\n- `sourceFormat?: 'markdown' | 'html' | 'both'`\n- `initialMode?: LegacyRichEditorMode`\n- `defaultEditorView?: LegacyRichEditorMode`\n- `featureFlags?: FeatureFlagOverrides`\n\n### `MDEditorProps`\n\n`LegacyRichEditor` wrapper with:\n\n- `sourceFormat` fixed to `'markdown'`\n- modes limited to `'visual' | 'json' | 'markdown'`\n\n### `HTMLEditorProps`\n\n`LegacyRichEditor` wrapper with:\n\n- `sourceFormat` fixed to `'html'`\n- modes limited to `'visual' | 'json' | 'html'`\n\n### `SlashEditorProps`\n\nInherits most of `ExtensiveEditorProps`, adds:\n\n- `slashVisibility?: SlashCommandVisibility`\n- `isDraggableEnabled?: boolean`\n- `featureFlags?: FeatureFlagOverrides`\n- `isToolbarEnabled?: boolean` (default `false`)\n\nSlash command support is enforced on.\n\n### `HeadlessEditorPresetProps`\n\nInherits `ExtensiveEditorProps` but constrains:\n\n- `initialMode?: 'visual' | 'json' | 'markdown' | 'html'`\n- `defaultEditorView?: same`\n- `featureFlags?: FeatureFlagOverrides`\n\nUses a text-pill toolbar and metadata-light defaults.\n\n## 3) Practical patterns\n\nVisual + markdown workflow:\n\n```tsx\n<MDEditor initialMode=\"visual\" defaultEditorView=\"markdown\" />\n```\n\nDisable heavy features without changing preset:\n\n```tsx\n<ExtensiveEditor\n  featureFlags={{\n    image: false,\n    table: false,\n    iframeEmbed: false,\n    youTubeEmbed: false,\n    customNode: false,\n  }}\n/>\n```\n\nSync host syntax theme with editor theme:\n\n```tsx\n<ExtensiveEditor\n  initialTheme=\"light\"\n  onThemeChange={(theme) => {\n    console.log(theme);\n  }}\n/>\n```\n\n## 4) Related pages\n\n- [/docs/luthor/architecture/](/docs/luthor/architecture/)\n- [/docs/luthor/feature-flags/](/docs/luthor/feature-flags/)\n- [/docs/luthor/presets/](/docs/luthor/presets/)\n",
    "urlPath": "/docs/luthor/props-reference/",
    "sourcePath": "apps/web/src/content/docs/luthor/props-reference.md",
    "updatedAt": "2026-03-11T16:50:11.209Z"
  }
];
