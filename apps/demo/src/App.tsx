import './App.css'
import { ExtensiveEditor, extensiveExtensions } from "@lyfie/luthor";
import type { ExtensiveEditorRef } from "@lyfie/luthor";
import React from "react";
import "@lyfie/luthor/styles.css";

const EXTENSIVE_DEMO_MARKDOWN = `# Extensive Editor: Full Capability Snapshot

Use this editor as a complete production-ready sandbox.

## Text and Typography

- **Bold**, *italic*, <u>underline</u>, ~~strikethrough~~
- Subscript and superscript
- Font family, font size, and line-height controls
- Text color and highlight controls

## Rich Structure

- Headings, paragraph, quote, and code blocks
- Bulleted, numbered, and check lists
- Horizontal rule insertion
- Tables with row/column editing tools

## Media + Power Tools

- Image insertion with resizing and alignment
- HTML embed blocks
- Floating toolbar on text selection
- Context menu and draggable block controls

## Productivity

- Undo/redo history
- Command palette (Ctrl+Shift+P)
- HTML + Markdown source mode round-trips
- Custom feature-card node support
`;

const CATEGORY_BY_EXTENSION: Record<string, string> = {
  bold: "Text",
  italic: "Text",
  underline: "Text",
  strikethrough: "Text",
  subscript: "Text",
  superscript: "Text",
  link: "Text",
  fontFamily: "Typography",
  fontSize: "Typography",
  lineHeight: "Typography",
  textColor: "Typography",
  textHighlight: "Typography",
  blockFormat: "Structure",
  list: "Structure",
  table: "Structure",
  horizontalRule: "Structure",
  code: "Code",
  codeFormat: "Code",
  codeIntelligence: "Code",
  tabIndent: "Workflow",
  enterKeyBehavior: "Workflow",
  history: "Workflow",
  commandPalette: "Workflow",
  contextMenu: "Workflow",
  draggableBlock: "Workflow",
  floatingToolbar: "Workflow",
  image: "Media",
  htmlEmbed: "Media",
  markdown: "Import / Export",
  html: "Import / Export",
  featureCard: "Custom",
};

const CATEGORY_ORDER = ["Text", "Typography", "Structure", "Code", "Media", "Workflow", "Import / Export", "Custom", "Other"] as const;

function titleFromExtensionKey(key: string): string {
  return key
    .replace(/Extension$/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function App() {
  const editorRef = React.useRef<ExtensiveEditorRef>(null);
  const [copied, setCopied] = React.useState(false);

  const extensionNames = React.useMemo(() => {
    const names = extensiveExtensions
      .map((extension) => (extension as { name?: string }).name)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names));
  }, []);

  const groupedFeatures = React.useMemo(() => {
    const groups = new Map<string, string[]>();

    extensionNames.forEach((name) => {
      const category = CATEGORY_BY_EXTENSION[name] ?? "Other";
      const current = groups.get(category) ?? [];
      current.push(name);
      groups.set(category, current);
    });

    return CATEGORY_ORDER
      .map((title) => ({
        title,
        items: (groups.get(title) ?? []).sort((a, b) => a.localeCompare(b)),
      }))
      .filter((group) => group.items.length > 0);
  }, [extensionNames]);

  // Handle when editor is ready - inject content immediately
  const handleEditorReady = React.useCallback((methods: ExtensiveEditorRef) => {
    console.log("🎯 Editor ready - injecting content immediately");
    methods.injectMarkdown(`# Welcome to the Luthor Demo!`);
  }, []);

  const handleLoadDemoContent = React.useCallback(() => {
    editorRef.current?.injectMarkdown(EXTENSIVE_DEMO_MARKDOWN);
  }, []);

  const handleCopyMarkdown = React.useCallback(async () => {
    const markdown = editorRef.current?.getMarkdown();
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, []);

  return (
    <div className="app-shell">
      <main className="demo-layout">
        <header className="demo-header">
          <p className="demo-kicker">Luthor Extensive Demo</p>
          <h1>Headless Feature Coverage</h1>
          <p>
            Live extension inventory sourced from the current extensive preset, with a clean editor canvas for fast visual
            validation.
          </p>
        </header>

        <section className="feature-panel" aria-label="Current extensive editor feature coverage">
          <div className="feature-panel__top">
            <div>
              <h2>Available Capabilities</h2>
              <p>{extensionNames.length} active extensions in this build.</p>
            </div>
            <div className="feature-panel__actions">
              <button type="button" className="demo-button" onClick={handleLoadDemoContent}>
                Load Feature Demo Content
              </button>
              <button type="button" className="demo-button demo-button--ghost" onClick={handleCopyMarkdown}>
                {copied ? "Copied" : "Copy Current Markdown"}
              </button>
            </div>
          </div>

          <div className="feature-grid">
            {groupedFeatures.map((group) => (
              <article key={group.title} className="feature-group">
                <h3>{group.title}</h3>
                <div className="feature-chips">
                  {group.items.map((item) => (
                    <span key={item} className="feature-chip">
                      {titleFromExtensionKey(item)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="editor-panel" aria-label="Extensive editor canvas">
          <div className="editor-panel__frame">
            <div className="editor-panel__container">
              <ExtensiveEditor ref={editorRef} onReady={handleEditorReady} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
