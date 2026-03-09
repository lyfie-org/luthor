export const docsIndex = [
  {
    "slug": [
      "getting-started"
    ],
    "title": "Introduction",
    "description": "What @lyfie/luthor and @lyfie/luthor-headless are, and when to use each package.",
    "content": "\n# Introduction\n\n`@lyfie/luthor` and `@lyfie/luthor-headless` solve different needs.\n\n## @lyfie/luthor\n\nUse this when you want a production-ready editor quickly.\n\n- Includes preset editors and prebuilt UI\n- Includes `@lyfie/luthor-headless` under the hood\n- Best for fast shipping with strong defaults\n\n## @lyfie/luthor-headless\n\nUse this when you want full control over UI and behavior.\n\n- Extension-first architecture\n- Bring your own toolbar and app UX\n- Best for custom product-specific editing flows\n\n## Compatibility\n\nBased on package metadata in `packages/luthor/package.json` and `packages/headless/package.json`:\n\n- React: `^18.0.0 || ^19.0.0`\n- React DOM: `^18.0.0 || ^19.0.0`\n- TypeScript/TSX: fully supported\n- Lexical:\n  - `@lyfie/luthor`: uses Lexical `^0.40.0` dependencies internally\n  - `@lyfie/luthor-headless`: peer dependency `>=0.40.0` for `lexical` and required `@lexical/*` packages\n\n## Recommended path\n\n1. [Introduction](/docs/getting-started/)\n2. [Installation](/docs/getting-started/installation/)\n3. [Capabilities](/docs/getting-started/capabilities/)\n4. [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/)\n5. [@lyfie/luthor](/docs/getting-started/luthor/)\n",
    "urlPath": "/docs/getting-started/",
    "sourcePath": "apps/web/src/content/docs/getting-started/index.md",
    "updatedAt": "2026-02-28T08:21:28.201Z"
  },
  {
    "slug": [
      "getting-started",
      "capabilities"
    ],
    "title": "Capabilities",
    "description": "Complete capability overview copied from the home page Why Luthor section, with package availability notes.",
    "content": "\n# Capabilities\nFor Lexical engine-level behavior and APIs, read the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).\n\n## Typography Controls\n\n![Typography controls preview](/features/Feature1.gif)\n\nCustom fonts, font size controls, and line-height that behaves. Typography should fit your product voice, not force browser defaults.\n\n- Use any custom font you want.\n- Dial in font sizes for readability.\n- Granular line-height control for cleaner rhythm.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Essentials Done Right\n\n![Text formatting essentials preview](/features/Feature2.gif)\n\nBold, italic, underline, strike, sub/superscript, code, and quotes. Core formatting is implemented cleanly and type-safe.\n\n- Bold, italic, underline, and strikethrough.\n- Subscript and superscript support.\n- Inline code and block quotes.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Color And Highlight\n\n![Color and highlight preview](/features/Feature3.gif)\n\nApply font color and highlights without inline style chaos. Color tools integrate with themes and keep output clean.\n\n- Font color support.\n- Highlight support.\n- Theme-friendly output styles.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Links And Structure\n\n![Links and structure preview](/features/Feature4.gif)\n\nPredictable links plus semantic headings and paragraph flow. Link insertion is clean, and document hierarchy stays sane.\n\n- Predictable link insertion behavior.\n- Paragraphs and headings from H1 to H6.\n- Left, center, right, and justify alignment.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Lists That Know What They're Doing\n\n![Lists preview](/features/Feature5.gif)\n\nUnordered, ordered, and checklist/task lists in one workflow. Use the right list type without fighting editor state.\n\n- Unordered lists for free-form notes.\n- Ordered lists for sequences and steps.\n- Checklist/task lists for actionable content.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Indentation Control\n\n![Indentation preview](/social-card.svg)\n\nIndent in and out with consistent, structure-safe behavior. Tab behavior is predictable and respects document structure.\n\n- Tab in and tab out quickly.\n- Supports structured indentation behavior.\n- Works cleanly with nested content.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Rich Embeds\n\n![Rich embed preview](/social-card.svg)\n\nEmbed images, iframes, and YouTube content with minimal friction. Paste and render rich media without bolt-on hacks.\n\n- Image embedding support.\n- Iframe embedding support.\n- YouTube embed flow.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Code Blocks\n\n![Code block preview](/features/Feature8.gif)\n\nSyntax-ready code blocks for docs, tutorials, and snippets. Code content stays structured and extendable for real product usage.\n\n- Dedicated code block support.\n- Built for developer-focused content.\n- Extensible for richer syntax experiences.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Dark/Light Ready\n\n![Theme switching preview](/features/Feature9.gif)\n\nEditor-layer theme support, not fragile visual hacks. Dark and light mode behavior is built in from the editor layer.\n\n- Theme switching support.\n- Consistent readability across themes.\n- Works with your app-level styling model.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## History + Shortcuts\n\n![Undo, redo, and shortcuts preview](/features/Feature10.gif)\n\nUndo/redo and keyboard-first interactions across core features. Move fast without relying on toolbar clicks.\n\n- Full undo and redo history.\n- Keyboard-friendly command flow.\n- Built for power-user editing speed.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Slash Command Center\n\n![Slash command preview](/features/Feature11.gif)\n\nType `/` to discover and trigger editor actions quickly. Slash commands are fast, predictable, and easy to extend.\n\n- Type `/` to reveal actions.\n- Predictable command discovery.\n- Extensible command architecture.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n\n## Custom Blocks\n\n![Custom block preview](/features/Feature12.gif)\n\nCreate custom nodes and schema extensions for product-specific UX. If defaults are not enough, the editor can be shaped around your needs.\n\n- Create custom nodes.\n- Inject product-specific blocks.\n- Extend schema behavior safely.\n\n| Package | Availability |\n| --- | --- |\n| `@lyfie/luthor` | Yes |\n| `@lyfie/luthor-headless` | Yes |\n",
    "urlPath": "/docs/getting-started/capabilities/",
    "sourcePath": "apps/web/src/content/docs/getting-started/capabilities.md",
    "updatedAt": "2026-02-28T08:24:26.703Z"
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
    "content": "\n# @lyfie/luthor-headless\n\nUse this when you need full control over editor UI.\n\n## Install\n\n```bash\nnpm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom\n```\n\n## Render a minimal headless editor\n\n```tsx\nimport {\n  createEditorSystem,\n  RichText,\n  richTextExtension,\n  boldExtension,\n  italicExtension,\n} from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension, boldExtension, italicExtension] as const;\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();\n\nfunction Toolbar() {\n  const { commands, activeStates } = useEditor();\n\n  return (\n    <div>\n      <button onClick={() => commands.toggleBold?.()} aria-pressed={activeStates.bold === true}>Bold</button>\n      <button onClick={() => commands.toggleItalic?.()} aria-pressed={activeStates.italic === true}>Italic</button>\n    </div>\n  );\n}\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <Toolbar />\n      <RichText placeholder=\"Write here...\" />\n    </Provider>\n  );\n}\n```\n\n## Validate installation\n\n- Text area mounts\n- Buttons execute bold and italic commands\n- No missing peer dependency errors for Lexical packages\n\n## Learn more about Lexical\n\n`@lyfie/luthor-headless` is built on top of Lexical. For deeper engine capabilities and low-level APIs, use the official Lexical documentation: [lexical.dev/docs](https://lexical.dev/docs/intro).\n",
    "urlPath": "/docs/getting-started/luthor-headless/",
    "sourcePath": "apps/web/src/content/docs/getting-started/luthor-headless.md",
    "updatedAt": "2026-02-28T08:24:04.311Z"
  },
  {
    "slug": [
      "getting-started",
      "luthor"
    ],
    "title": "@lyfie/luthor",
    "description": "Minimal setup and validation for the preset package.",
    "content": "\n# @lyfie/luthor\n\nUse this when you want a ready-to-use editor quickly.\n\n## Install\n\n```bash\nnpm install @lyfie/luthor react react-dom\n```\n\n## Render a basic editor\n\n```tsx\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <ExtensiveEditor placeholder=\"Start writing...\" />;\n}\n```\n\n## Validate installation\n\n- You can type in the editor\n- Toolbar appears\n- No module resolution errors in the dev server\r\n",
    "urlPath": "/docs/getting-started/luthor/",
    "sourcePath": "apps/web/src/content/docs/getting-started/luthor.md",
    "updatedAt": "2026-02-24T11:44:30.280Z"
  },
  {
    "slug": [
      "luthor-headless",
      "features"
    ],
    "title": "Features",
    "description": "Grouped feature documentation for @lyfie/luthor-headless.",
    "content": "\n# Features\n\nFeature docs are grouped to match the home page feature set.\n\n## Feature groups\n\n- [Typography and Text](/docs/luthor-headless/features/typography-and-text/)\n- [Structure and Lists](/docs/luthor-headless/features/structure-and-lists/)\n- [Media and Embeds](/docs/luthor-headless/features/media-and-embeds/)\n- [Code and Devtools](/docs/luthor-headless/features/code-and-devtools/)\n- [Interaction and Productivity](/docs/luthor-headless/features/interaction-and-productivity/)\n- [Customization and Theming](/docs/luthor-headless/features/customization-and-theming/)\n\nFor deeper engine-level capability details, see the official Lexical docs: [lexical.dev/docs](https://lexical.dev/docs/intro).\n\n## Base runtime\n\n```tsx\nimport { createEditorSystem, RichText, richTextExtension } from '@lyfie/luthor-headless';\n\nconst extensions = [richTextExtension] as const;\nconst { Provider } = createEditorSystem<typeof extensions>();\n\nexport function App() {\n  return (\n    <Provider extensions={extensions}>\n      <RichText placeholder=\"Write here...\" />\n    </Provider>\n  );\n}\n```\n",
    "urlPath": "/docs/luthor-headless/features/",
    "sourcePath": "apps/web/src/content/docs/luthor-headless/features.md",
    "updatedAt": "2026-02-28T08:24:29.540Z"
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
      "luthor",
      "presets"
    ],
    "title": "Presets",
    "description": "Preset catalog for @lyfie/luthor, including per-preset docs.",
    "content": "\n# Presets\n\n`@lyfie/luthor` is a preset package built on top of `@lyfie/luthor-headless`.\n\n## Importing headless from presets package\n\n```ts\nimport { headless } from '@lyfie/luthor';\n```\n\n## Preset docs\n\n- [Extensive Editor](/docs/luthor/presets/extensive-editor/)\n- [Rich Text Input](/docs/luthor/presets/compose-editor/)\n- [Simple Text Input](/docs/luthor/presets/composer-editor/)\n- [MD Editor](/docs/luthor/presets/md-friendly-editor/)\n- [Slash Editor](/docs/luthor/presets/notion-like-editor/)\n- [Headless Text Input](/docs/luthor/presets/headless-editor-preset/)\n",
    "urlPath": "/docs/luthor/presets/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets.md",
    "updatedAt": "2026-03-09T15:18:03.131Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "compose-editor"
    ],
    "title": "Rich Text Input",
    "description": "Focused rich text compose preset with optional recipient rows.",
    "content": "\n# Rich Text Input\n\n`ComposeEditor` merges focused rich-text and draft-composition workflows into one surface.\n\nUse it as a clean rich editor, or enable recipient/subject rows when needed.\n\n## Usage\n\n```tsx\nimport { ComposeEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return (\n    <ComposeEditor\n      compactToolbar\n      showTo\n      showCc\n      showSubject\n      placeholder=\"Write your draft...\"\n    />\n  );\n}\n```\n\n## Props\n\n`ComposeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags`.\n\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides`\n- `compactToolbar`: `false (default) | true`\n- `showRecipients`: `false (default) | true`\n- `showTo`: `false (default) | true`\n- `showCc`: `false (default) | true`\n- `showBcc`: `false (default) | true`\n- `showSubject`: `false (default) | true`\n\n## Behavior\n\n- Defaults to focused formatting with media/embed-heavy features disabled.\n- Optional recipient rows render above the editor shell.\n- Supports feature flag overrides for deeper tuning.\r\n\r\n",
    "urlPath": "/docs/luthor/presets/compose-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/compose-editor.md",
    "updatedAt": "2026-03-09T15:18:15.904Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "composer-editor"
    ],
    "title": "Simple Text Input",
    "description": "Constrained message composer preset with send controls.",
    "content": "\n# Simple Text Input\n\n`ComposerEditor` is a constrained message-composer preset.\n\nIt keeps formatting intentionally minimal and supports send workflows out of the box.\n\n## Usage\n\n```tsx\nimport { ComposerEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return (\n    <ComposerEditor\n      placeholder=\"Type a message\"\n      submitOnEnter\n      allowShiftEnter\n      outputFormat=\"md\"\n      onSend={({ text }) => {\n        console.log(text);\n      }}\n    />\n  );\n}\n```\n\n## Props\n\n`ComposerEditorProps` is purpose-built for message input.\n\n- `formattingOptions`: `ComposerFormattingOptions`\n- `onSend`: `(payload: ComposerEditorSendPayload) => void`\n- `outputFormat`: `'md' (default) | 'json'`\n- `submitOnEnter`: `false (default) | true`\n- `allowShiftEnter`: `true (default) | false`\n- `showBottomToolbar`: `true (default) | false`\n- `toolbarButtons`: `readonly ComposerToolbarButton[]`\n- `sendButtonPlacement`: `'inside' (default) | 'right'`\n- `minHeight` / `maxHeight` / `minWidth` / `maxWidth`\n\n## Behavior\n\n- Allows only bold, italic, and strikethrough formatting.\n- Always runs visual mode only.\n- Supports auto-grow until `maxHeight`, then internal scrolling.\r\n\r\n",
    "urlPath": "/docs/luthor/presets/composer-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/composer-editor.md",
    "updatedAt": "2026-03-09T15:18:15.999Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "extensive-editor"
    ],
    "title": "Extensive Editor",
    "description": "Full-feature preset and core prop reference.",
    "content": "\n# Extensive Editor\n\n`ExtensiveEditor` is the base full-feature preset editor.\n\n## Usage\n\n```tsx\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <ExtensiveEditor placeholder=\"Write anything...\" />;\n}\n```\n\n## Core props\n\n- `initialTheme`: `'light' (default) | 'dark'`\n- `onThemeChange`: `(theme: 'light' | 'dark') => void`\n- `showDefaultContent`: `true (default) | false`\n- `placeholder`: `'Write anything...' (default) | string | { visual?: string; json?: string }`\n- `initialMode`: `'visual' (default) | 'json'`\n- `availableModes`: `['visual', 'json'] (default) | ('visual' | 'json')[]`\n- `toolbarPosition`: `'top' (default) | 'bottom'`\n- `toolbarAlignment`: `'left' (default) | 'center' | 'right'`\n- `isToolbarEnabled`: `true (default) | false`\n- `minimumDefaultLineHeight`: `1.5 (default) | string | number`\n- `scaleByRatio`: `false (default) | true`\n- `syncHeadingOptionsWithCommands`: `true (default) | false`\n- `commandPaletteShortcutOnly`: `false (default) | true`\n- `isCopyAllowed`: `true (default) | false`\n- `syntaxHighlighting`: `'auto' | 'disabled'` | extension default behavior if omitted\n- `maxListIndentation`: `8 (default) | number` (sub-indent levels below root)\n\n## Lists in Extensive\n\n- Ordered, unordered, and checklist styles are implemented in `@lyfie/luthor-headless` and surfaced in the preset toolbar.\n- `maxListIndentation` applies to all list types (ordered, unordered, checklist), including `Tab` and command-based indentation.\n- Checklist supports two variants:\n  - `strikethrough` (default): checked items render line-through text.\n  - `plain`: checked items do not strike through text.\n\n## Theme callback example (`highlight.js`)\n\nUse `onThemeChange` when host styling must follow the editor's internal theme state (for example, swapping `highlight.js` light/dark styles).\n\n```tsx\n'use client';\n\nimport { ExtensiveEditor } from '@lyfie/luthor';\nimport { useEffect, useState } from 'react';\n\ntype Theme = 'light' | 'dark';\nconst HIGHLIGHT_THEME_LINK_ID = 'luthor-highlightjs-theme';\n\nexport function EditorWithHighlightTheme() {\n  const [editorTheme, setEditorTheme] = useState<Theme>('light');\n\n  useEffect(() => {\n    const href =\n      editorTheme === 'dark'\n        ? '/highlightjs/github-dark.css'\n        : '/highlightjs/github.css';\n\n    const existing = document.getElementById(HIGHLIGHT_THEME_LINK_ID);\n    const link =\n      existing instanceof HTMLLinkElement\n        ? existing\n        : document.createElement('link');\n\n    if (!(existing instanceof HTMLLinkElement)) {\n      link.id = HIGHLIGHT_THEME_LINK_ID;\n      link.rel = 'stylesheet';\n      document.head.appendChild(link);\n    }\n\n    if (link.href !== new URL(href, window.location.origin).href) {\n      link.href = href;\n    }\n  }, [editorTheme]);\n\n  return (\n    <ExtensiveEditor\n      initialTheme=\"light\"\n      onThemeChange={setEditorTheme}\n      toolbarAlignment=\"center\"\n    />\n  );\n}\n```\n\nPlace these files in your app static assets:\n\n- `/public/highlightjs/github.css`\n- `/public/highlightjs/github-dark.css`\n\n## Ref API\n\n- `injectJSON(content: string): void`\n- `getJSON(): string`\n\n## Notes\n\nThis is the base preset that other presets build on.\r\n\r\n\r\n\r\n\r\n",
    "urlPath": "/docs/luthor/presets/extensive-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/extensive-editor.md",
    "updatedAt": "2026-03-09T15:18:15.912Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "headless-editor-preset"
    ],
    "title": "Headless Text Input",
    "description": "Reference preset showing direct headless composition.",
    "content": "\n# Headless Text Input\n\nSmall reference preset demonstrating direct headless composition.\n\n## Usage\n\n```tsx\nimport { HeadlessEditorPreset } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <HeadlessEditorPreset placeholder=\"Start writing...\" />;\n}\n```\n\n## Props\n\n- `className`: `undefined (default) | string`\n- `placeholder`: `'Start writing...' (default) | string`\n\n## Behavior\n\nUses a minimal extension set (`richText`, `history`, `bold`, `italic`, `underline`, `list`) and a lightweight toolbar.\r\n\r\n\r\n",
    "urlPath": "/docs/luthor/presets/headless-editor-preset/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/headless-editor-preset.md",
    "updatedAt": "2026-03-09T15:18:16.011Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "md-friendly-editor"
    ],
    "title": "MD Editor",
    "description": "Visual and markdown mode preset with mode-switch behavior.",
    "content": "\n# MD Editor\n\nPreset that switches between visual and markdown editing.\n\n## Usage\n\n```tsx\nimport { MDFriendlyEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <MDFriendlyEditor initialMode=\"visual\" />;\n}\n```\n\n## Props\n\n`MDFriendlyEditorProps` inherits `ExtensiveEditorProps` except `availableModes` and `initialMode`.\n\n- `initialMode`: `'visual' (default) | 'markdown'`\n\n## Behavior\n\n- Converts visual JSON to markdown when switching to markdown mode.\n- Parses markdown back into visual JSON when switching back.\n- Renders source textarea in markdown mode.\r\n\r\n",
    "urlPath": "/docs/luthor/presets/md-friendly-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/md-friendly-editor.md",
    "updatedAt": "2026-03-09T15:18:16.028Z"
  },
  {
    "slug": [
      "luthor",
      "presets",
      "notion-like-editor"
    ],
    "title": "Slash Editor",
    "description": "Slash-first preset with draggable and command-focused defaults.",
    "content": "\n# Slash Editor\n\nSlash-first preset with draggable-focused defaults.\n\n## Usage\n\n```tsx\nimport { NotionLikeEditor } from '@lyfie/luthor';\nimport '@lyfie/luthor/styles.css';\n\nexport function App() {\n  return <NotionLikeEditor isDraggableEnabled slashVisibility={{ allowlist: ['block.paragraph'] }} />;\n}\n```\n\n## Props\n\n`NotionLikeEditorProps` inherits `ExtensiveEditorProps` except `featureFlags` and `isToolbarEnabled`, then re-adds both.\n\n- `slashVisibility`: `undefined (default) | SlashCommandVisibility`\n- `isDraggableEnabled`: `true (default) | false`\n- `featureFlags`: `undefined (default) | FeatureFlagOverrides`\n- `isToolbarEnabled`: `false (default) | true`\n\n## Behavior\n\nDefaults enable slash commands, draggable blocks, and command palette while keeping toolbar hidden.\r\n\r\n",
    "urlPath": "/docs/luthor/presets/notion-like-editor/",
    "sourcePath": "apps/web/src/content/docs/luthor/presets/notion-like-editor.md",
    "updatedAt": "2026-03-09T14:05:44.263Z"
  }
];
