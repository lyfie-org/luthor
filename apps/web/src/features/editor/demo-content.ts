import { headless } from '@lyfie/luthor';

type JSONNode = Record<string, unknown>;

type DocumentNode = {
  root: {
    type: 'root';
    version: 1;
    format: '';
    indent: 0;
    direction: null;
    children: JSONNode[];
  };
};

const EMPTY_TEXT_STYLE = '';
const EMPTY_BLOCK_FORMAT = '';

function textNode(text: string, format = 0, style = EMPTY_TEXT_STYLE): JSONNode {
  return {
    type: 'text',
    version: 1,
    text,
    detail: 0,
    format,
    mode: 'normal',
    style,
  };
}

function lineBreakNode(): JSONNode {
  return {
    type: 'linebreak',
    version: 1,
  };
}

function paragraphNode(children: JSONNode[], format = EMPTY_BLOCK_FORMAT): JSONNode {
  return {
    type: 'paragraph',
    version: 1,
    format,
    indent: 0,
    direction: null,
    children,
  };
}

function headingNode(tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', text: string): JSONNode {
  return {
    type: 'heading',
    version: 1,
    tag,
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children: [textNode(text)],
  };
}

function quoteNode(text: string): JSONNode {
  return {
    type: 'quote',
    version: 1,
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children: [textNode(text)],
  };
}

function listItemNode(children: JSONNode[], value: number, checked?: boolean): JSONNode {
  return {
    type: 'listitem',
    version: 1,
    value,
    ...(typeof checked === 'boolean' ? { checked } : {}),
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children,
  };
}

function listNode(
  listType: 'bullet' | 'number' | 'check',
  tag: 'ul' | 'ol',
  items: JSONNode[],
): JSONNode {
  return {
    type: 'list',
    version: 1,
    listType,
    start: 1,
    tag,
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children: items,
  };
}

function codeNode(language: string, lines: string[]): JSONNode {
  const children: JSONNode[] = [];
  lines.forEach((line, index) => {
    children.push(textNode(line));
    if (index < lines.length - 1) {
      children.push(lineBreakNode());
    }
  });

  return {
    type: 'code',
    version: 1,
    language,
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children,
  };
}

function tableCellNode(text: string, headerState: 0 | 3, width: number): JSONNode {
  return {
    type: 'tablecell',
    version: 1,
    headerState,
    colSpan: 1,
    rowSpan: 1,
    width,
    backgroundColor: null,
    children: [paragraphNode([textNode(text)])],
  };
}

function tableNode(rows: Array<Array<{ text: string; isHeader?: boolean; width: number }>>): JSONNode {
  return {
    type: 'table',
    version: 1,
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children: rows.map((row) => ({
      type: 'tablerow',
      version: 1,
      children: row.map((cell) => tableCellNode(cell.text, cell.isHeader ? 3 : 0, cell.width)),
    })),
  };
}

function documentToJSONString(children: JSONNode[]): string {
  const payload: DocumentNode = {
    root: {
      type: 'root',
      version: 1,
      format: EMPTY_BLOCK_FORMAT,
      indent: 0,
      direction: null,
      children,
    },
  };

  return JSON.stringify(payload);
}

function markdownToJSONString(markdownSource: string): string {
  return JSON.stringify(headless.markdownToJSON(markdownSource));
}

function htmlToJSONString(htmlSource: string): string {
  return JSON.stringify(headless.htmlToJSON(htmlSource));
}

export const HOME_EXTENSIVE_SHORT_CONTENT = documentToJSONString([
  headingNode('h2', 'Ship Luthor in Minutes'),
  paragraphNode([
    textNode('Install '),
    textNode('@lyfie/luthor', 16),
    textNode(', import the stylesheet, and render '),
    textNode('<ExtensiveEditor />', 16),
    textNode('.'),
  ]),
  listNode('number', 'ol', [
    listItemNode([paragraphNode([textNode('pnpm add @lyfie/luthor react react-dom')])], 1),
    listItemNode([paragraphNode([textNode("import '@lyfie/luthor/styles.css'")])], 2),
    listItemNode([paragraphNode([textNode('Mount the preset and start typing')])], 3),
  ]),
]);

export const WEB_DEMO_EXTENSIVE_CONTENT = documentToJSONString([
  headingNode('h1', 'Extensive Preset: Full Capability Walkthrough'),
  paragraphNode([
    textNode('This sample is injected as '),
    textNode('JSON', 1),
    textNode(' and demonstrates rich formatting, embeds, slash flows, and source round-trips.'),
  ]),
  paragraphNode([
    textNode('Bold', 1),
    textNode(' | '),
    textNode('Italic', 2),
    textNode(' | '),
    textNode('Underline', 8),
    textNode(' | '),
    textNode('Strikethrough', 4),
    textNode(' | '),
    textNode('Inline code', 16),
  ]),
  paragraphNode(
    [
      textNode(
        'Typography and style variables are live: font family, size, color, highlight, and line-height.',
        0,
        "font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 18px; line-height: 1.7; color: #1d4ed8; background-color: #dbeafe;",
      ),
    ],
  ),
  quoteNode('Luthor keeps visual editing fast while preserving JSON as the canonical document model.'),
  paragraphNode([
    {
      type: 'link',
      version: 1,
      rel: 'noreferrer',
      target: '_blank',
      title: 'Luthor documentation',
      url: 'https://github.com/lyfie-org/luthor',
      format: EMPTY_BLOCK_FORMAT,
      indent: 0,
      direction: null,
      children: [textNode('Open docs and repository')],
    },
    textNode(' to inspect preset APIs, feature flags, and extension wiring.'),
  ]),
  headingNode('h2', 'Lists + structure'),
  listNode('bullet', 'ul', [
    listItemNode([paragraphNode([textNode('Unordered list with custom style support')])], 1),
    listItemNode([paragraphNode([textNode('Nested command and toolbar controls')])], 2),
  ]),
  listNode('number', 'ol', [
    listItemNode([paragraphNode([textNode('Draft')])], 1),
    listItemNode([paragraphNode([textNode('Review')])], 2),
    listItemNode([paragraphNode([textNode('Publish')])], 3),
  ]),
  listNode('check', 'ul', [
    listItemNode([paragraphNode([textNode('Enable source tabs')])], 1, true),
    listItemNode([paragraphNode([textNode('Capture JSON snapshot')])], 2, false),
  ]),
  codeNode('typescript', [
    "import { ExtensiveEditor } from '@lyfie/luthor';",
    '',
    'export function ArticleEditor() {',
    '  return <ExtensiveEditor isToolbarPinned toolbarAlignment="center" />;',
    '}',
  ]),
  {
    type: 'horizontalrule',
    version: 1,
  },
  {
    type: 'featureCard',
    version: 1,
    payload: {
      title: 'AI Draft: Weekly Product Update',
      description: 'Custom-node payloads stay structured and editable inside the visual surface.',
      tag: 'AI Draft',
    },
    format: EMPTY_BLOCK_FORMAT,
    indent: 0,
    direction: null,
    children: [],
  },
  {
    type: 'image',
    version: 1,
    src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    alt: 'Developer writing code in an editor',
    caption: 'Image node with caption and persisted sizing.',
    alignment: 'center',
    width: 760,
    height: 430,
  },
  {
    type: 'youtube-embed',
    version: 1,
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    width: 720,
    height: 405,
    alignment: 'center',
    start: 0,
  },
  {
    type: 'iframe-embed',
    version: 1,
    src: 'https://example.com',
    width: 720,
    height: 405,
    alignment: 'center',
    title: 'Iframe integration example',
  },
  tableNode([
    [
      { text: 'Capability', isHeader: true, width: 260 },
      { text: 'Status', isHeader: true, width: 320 },
    ],
    [
      { text: 'Visual <-> JSON round-trip', width: 260 },
      { text: 'Ready', width: 320 },
    ],
    [
      { text: 'Markdown + HTML source tabs', width: 260 },
      { text: 'Ready', width: 320 },
    ],
  ]),
  paragraphNode([
    textNode('Try '),
    textNode('/', 16),
    textNode(' for slash commands and '),
    textNode('Ctrl/Cmd+Shift+P', 16),
    textNode(' for command palette.'),
  ]),
]);

export const WEB_DEMO_COMPOSE_CONTENT = documentToJSONString([
  headingNode('h2', 'Compose Editor: Focused Drafting'),
  paragraphNode([
    textNode('Compose keeps the authoring flow tight while still preserving '),
    textNode('JSON', 1),
    textNode(' export compatibility.'),
  ]),
  paragraphNode([
    textNode('Use this preset for outbound replies, support responses, and short editorial drafts.'),
  ]),
  listNode('bullet', 'ul', [
    listItemNode([paragraphNode([textNode('Essential formatting and clean toolbar density')])], 1),
    listItemNode([paragraphNode([textNode('Visual + JSON modes for reliable persistence')])], 2),
  ]),
  paragraphNode([
    textNode('Escalation summary: ', 1),
    textNode('The API limit was reached at 09:42 UTC. We retried with exponential backoff and restored service in 7 minutes.'),
  ]),
]);

export const WEB_DEMO_SIMPLE_EDITOR_CONTENT = documentToJSONString([
  paragraphNode([
    textNode('Quick update: '),
    textNode('bold', 1),
    textNode(', '),
    textNode('italic', 2),
    textNode(', and '),
    textNode('strikethrough', 4),
    textNode(' are available in this lightweight composer.'),
  ]),
]);

const LEGACY_RICH_MARKDOWN_SOURCE = `# Legacy Rich Editor

This preset prioritizes **metadata-free** markdown/html compatibility.

- Supports headings, paragraphs, links, lists, quotes, and code blocks.
- Keeps source workflows predictable for migration-heavy products.

> Use Legacy Rich when clean source output matters more than advanced embeds.

\`\`\`ts
export const save = (markdown: string) => persist(markdown);
\`\`\`

---

[Read the preset docs](/docs/luthor/presets/legacy-rich-editor/)`;

const MD_EDITOR_SOURCE = `# MD Editor

Markdown-first editing with visual and JSON side-by-side support.

## Checklist

- [x] Heading and list support
- [x] Inline formatting
- [ ] Publish migration guide

\`\`\`bash
pnpm add @lyfie/luthor
\`\`\`

> Switch tabs to inspect how markdown maps to JSON.`;

const HTML_EDITOR_SOURCE = `<h1>HTML Editor</h1>
<p>This preset focuses on clean <strong>HTML-compatible</strong> authoring.</p>
<p><em>Use it for template tooling and HTML persistence pipelines.</em></p>
<ul>
  <li>Headings and paragraphs</li>
  <li>Lists and blockquotes</li>
  <li>Code blocks and links</li>
</ul>
<blockquote>Great for HTML-first migration strategies.</blockquote>
<pre><code class="language-html">&lt;section&gt;Production-safe content&lt;/section&gt;</code></pre>
<hr />
<p><a href="/docs/luthor/presets/html-editor/">Open HTML preset docs</a></p>`;

export const WEB_DEMO_LEGACY_RICH_CONTENT = markdownToJSONString(LEGACY_RICH_MARKDOWN_SOURCE);
export const WEB_DEMO_MD_EDITOR_CONTENT = markdownToJSONString(MD_EDITOR_SOURCE);
export const WEB_DEMO_HTML_EDITOR_CONTENT = htmlToJSONString(HTML_EDITOR_SOURCE);

export const WEB_DEMO_SLASH_EDITOR_CONTENT = documentToJSONString([
  headingNode('h2', 'Slash Editor: Keyboard-First Workflow'),
  paragraphNode([
    textNode('Type '),
    textNode('/', 16),
    textNode(' to open command suggestions and insert structured blocks quickly.'),
  ]),
  listNode('bullet', 'ul', [
    listItemNode([paragraphNode([textNode('Slash command allowlist is curated for fast authoring')])], 1),
    listItemNode([paragraphNode([textNode('Draggable blocks help reorder sections without copy/paste')])], 2),
  ]),
  tableNode([
    [
      { text: 'Shortcut', isHeader: true, width: 260 },
      { text: 'Action', isHeader: true, width: 320 },
    ],
    [
      { text: '/', width: 260 },
      { text: 'Open slash menu', width: 320 },
    ],
    [
      { text: 'Tab / Shift+Tab', width: 260 },
      { text: 'Indent / outdent list context', width: 320 },
    ],
  ]),
  codeNode('markdown', ['# Draft section', '', '- Capture key outcomes', '- Move blocks to prioritize']),
  {
    type: 'horizontalrule',
    version: 1,
  },
  paragraphNode([textNode('This profile is ideal for Notion-like structured writing surfaces.')]),
]);

export const WEB_DEMO_HEADLESS_PRESET_CONTENT = documentToJSONString([
  headingNode('h1', 'Headless Preset: Lightweight Controls'),
  paragraphNode([
    textNode('This preset demonstrates the compact toolbar profile backed by the same JSON core.'),
  ]),
  headingNode('h2', 'Formatting'),
  paragraphNode([
    textNode('Use Bold, Italic, Strike, Code, and clear actions for fast text cleanup.'),
  ]),
  headingNode('h3', 'Structure'),
  listNode('bullet', 'ul', [
    listItemNode([paragraphNode([textNode('Heading toggles (H1-H6)')])], 1),
    listItemNode([paragraphNode([textNode('Bullet and ordered lists')])], 2),
    listItemNode([paragraphNode([textNode('Quote, code block, and horizontal rule')])], 3),
  ]),
  quoteNode('Headless preset keeps the surface minimal while preserving robust source tabs.'),
  codeNode('javascript', ['const snapshot = editor.getJSON();', 'save(snapshot);']),
]);
