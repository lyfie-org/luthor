export type WikiSection = {
  id: string;
  title: string;
  summary: string;
  bullets?: string[];
  snippet?: {
    language: "bash" | "tsx" | "typescript";
    code: string;
  };
  sourceRefs: string[];
};

export const DOCS_WIKI_SECTIONS: WikiSection[] = [
  {
    id: "overview",
    title: "Overview",
    summary:
      "Luthor is the plug-and-play package. Luthor Headless is the type-safe extension runtime for full control. Both target React and Lexical workflows.",
    bullets: [
      "Use @lyfie/luthor for fastest product onboarding.",
      "Use @lyfie/luthor-headless for custom UI + command architecture.",
      "React peer support: 18 and 19.",
      "Lexical-based runtime with extension-driven composition.",
    ],
    sourceRefs: [
      "documentation/user/luthor/getting-started.md",
      "documentation/user/headless/getting-started.md",
      "documentation/developer/headless/architecture.md",
    ],
  },
  {
    id: "quick-install",
    title: "Quick Install",
    summary: "Install preset or headless path depending on integration depth.",
    snippet: {
      language: "bash",
      code: "pnpm add @lyfie/luthor react react-dom\n\n# Headless path\npnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom",
    },
    sourceRefs: [
      "documentation/user/luthor/getting-started.md",
      "documentation/user/headless/getting-started.md",
    ],
  },
  {
    id: "preset-usage",
    title: "Preset Usage",
    summary: "Use ExtensiveEditor when you need immediate delivery with built-in UX modules.",
    bullets: [
      "Includes toolbar, floating toolbar, command palette, slash menu, emoji menu, and source modes.",
      "Supports visual/html/markdown/jsonb mode switching.",
      "Use initialTheme and CSS overrides for branding.",
    ],
    snippet: {
      language: "tsx",
      code: "import { ExtensiveEditor } from \"@lyfie/luthor\";\nimport \"@lyfie/luthor/styles.css\";\n\nexport function App() {\n  return <ExtensiveEditor placeholder=\"Start writing...\" />;\n}",
    },
    sourceRefs: [
      "documentation/user/luthor/getting-started.md",
      "documentation/user/luthor/extensive-editor.md",
    ],
  },
  {
    id: "headless-usage",
    title: "Headless Usage",
    summary: "Compose typed extensions and generate command/state APIs directly from your extension list.",
    bullets: [
      "Declare extensions as const for full type inference.",
      "Use createEditorSystem<typeof extensions>() for typed commands and activeStates.",
      "Configure extensions outside render and reuse instances.",
    ],
    snippet: {
      language: "tsx",
      code: "import { createEditorSystem, richTextExtension, boldExtension, italicExtension, RichText } from \"@lyfie/luthor-headless\";\n\nconst extensions = [richTextExtension, boldExtension, italicExtension] as const;\nconst { Provider, useEditor } = createEditorSystem<typeof extensions>();",
    },
    sourceRefs: [
      "documentation/user/headless/getting-started.md",
      "documentation/user/headless/extensions-and-configuration.md",
      "documentation/developer/headless/architecture.md",
    ],
  },
  {
    id: "extensions",
    title: "Extension Catalog",
    summary: "Core UX, formatting, media, import/export, and custom node extension groups are built-in.",
    bullets: [
      "Core UX: history, slash command, floating toolbar, context menu, draggable block.",
      "Formatting: text styles, code, lists, tables, typography and color controls.",
      "Media: image, iframe embed, YouTube embed.",
      "Custom: createCustomNodeExtension(...) for domain-specific blocks.",
    ],
    sourceRefs: ["documentation/user/headless/extensions-and-configuration.md"],
  },
  {
    id: "import-export",
    title: "Import / Export Strategy",
    summary:
      "For production reliability, keep JSON as source-of-truth and add HTML or enhanced markdown for interop and human-readability.",
    bullets: [
      "Canonical: Lexical JSON for exact state fidelity.",
      "Interop: HTML path for CMS/web channels.",
      "Enhanced markdown: metadata comments preserve richer embedded node details.",
      "Validate untrusted import content before injection.",
    ],
    snippet: {
      language: "typescript",
      code: "import { EnhancedMarkdownConvertor } from \"@lyfie/luthor-headless\";\n\nconst markdown = EnhancedMarkdownConvertor.lexicalNodesToEnhancedMarkdown(editorState.root.children);\nconst { cleanedMarkdown, metadata } = EnhancedMarkdownConvertor.parseEnhancedMarkdown(markdown);",
    },
    sourceRefs: [
      "documentation/user/headless/import-export.md",
      "documentation/tutorials/enhanced-markdown-quick-start.md",
      "documentation/PROJECT-DELIVERABLES.md",
    ],
  },
  {
    id: "guidelines",
    title: "Production Guidelines",
    summary: "Use this checklist when shipping Luthor editors in production applications.",
    bullets: [
      "Choose package path: preset speed vs headless control.",
      "Persist JSONB/JSON as primary state; keep markdown/html as secondary outputs.",
      "Enable URL validation and secure link defaults (noopener noreferrer).",
      "Use typed extension arrays and avoid runtime extension mutation.",
      "Profile large docs and keep conversion flows explicit in your persistence pipeline.",
    ],
    sourceRefs: [
      "documentation/user/headless/extensions-and-configuration.md",
      "documentation/user/headless/import-export.md",
      "documentation/developer/headless/architecture.md",
      "documentation/developer/luthor/architecture.md",
    ],
  },
];
