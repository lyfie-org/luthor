import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import { extensiveExtensions, setFloatingToolbarContext } from "./extensions";
import { CommandPalette, commandsToCommandPaletteItems, ModeTabs, registerKeyboardShortcuts, SourceView, Toolbar, type CoreEditorCommands } from "../../core";
import type { CommandPaletteExtension } from "@lyfie/luthor-headless";
import "./styles.css";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export type ExtensiveEditorMode = "visual" | "html" | "markdown";

export interface ExtensiveEditorRef {
  injectMarkdown: (content: string) => void;
  injectHTML: (content: string) => void;
  getMarkdown: () => string;
  getHTML: () => string;
}

const HEADLESS_FEATURE_GROUPS = [
  {
    title: "Formatting",
    items: ["bold", "italic", "underline", "strikethrough", "fontFamily", "link", "code"],
  },
  {
    title: "Structure",
    items: ["blockFormat", "list", "table", "horizontalRule", "codeFormat", "codeIntelligence"],
  },
  {
    title: "Media",
    items: ["image", "htmlEmbed", "floatingToolbar"],
  },
  {
    title: "Workflow",
    items: ["history", "commandPalette", "contextMenu", "draggableBlock"],
  },
  {
    title: "Export & Custom",
    items: ["html", "markdown", "featureCard"],
  },
] as const;

const FEATURE_DEMO_MARKDOWN = `# Extensive Preset – Full Feature Showcase

This preset demonstrates all capabilities from **@lyfie/luthor-headless**.

## Text Formatting

Use **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, [links](https://lexical.dev), and \
\`inline code\`.

## Block Features

> Convert this paragraph to quote, heading, paragraph, or code block from the toolbar.

Type \`---\` or \`___\` then press space/enter to insert a horizontal rule.

---

## Lists

- Bulleted item 1
- Bulleted item 2

1. Numbered item 1
2. Numbered item 2

## Code Block

\`\`\`ts
const showcase = "Headless features";
console.log(showcase);
\`\`\`

## Table (insert from toolbar)

Use the table button to insert and edit a table with context menu actions.

## Media

Insert images and HTML embeds from the toolbar, then select them for floating controls.

## Command Palette & Source Modes

- Open command palette: **Ctrl+Shift+P**
- Toggle HTML/Markdown tabs to test import/export round trips
`;

function titleFromExtensionKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function ExtensiveEditorContent({
  isDark,
  toggleTheme,
  onReady,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  onReady?: (methods: ExtensiveEditorRef) => void;
}) {
  const { commands, hasExtension, activeStates, lexical: editor, extensions } = useEditor();
  const [mode, setMode] = useState<ExtensiveEditorMode>("visual");
  const [content, setContent] = useState({ html: "", markdown: "" });
  const [commandPaletteState, setCommandPaletteState] = useState({
    isOpen: false,
    commands: [] as ReturnType<typeof commandsToCommandPaletteItems>,
  });
  const commandsRef = useRef<CoreEditorCommands>(commands as CoreEditorCommands);
  const readyRef = useRef(false);

  useEffect(() => {
    commandsRef.current = commands as CoreEditorCommands;
  }, [commands]);

  useEffect(() => {
    setFloatingToolbarContext(commands, activeStates, isDark ? "dark" : "light");
  }, [commands, activeStates, isDark]);

  const methods = useMemo<ExtensiveEditorRef>(
    () => ({
      injectMarkdown: (value: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromMarkdown(value, { immediate: true, preventFocus: true });
            });
          }
        }, 100);
      },
      injectHTML: (value: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromHTML(value, { preventFocus: true });
            });
          }
        }, 100);
      },
      getMarkdown: () => commandsRef.current.exportToMarkdown(),
      getHTML: () => commandsRef.current.exportToHTML(),
    }),
    [editor],
  );

  useEffect(() => {
    if (!editor || !commands) return;

    const commandApi = commands as CoreEditorCommands;
    const paletteItems = commandsToCommandPaletteItems(commandApi);
    paletteItems.forEach((cmd) => commandApi.registerCommand(cmd));

    const unregisterShortcuts = registerKeyboardShortcuts(commandApi, document.body);

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      paletteItems.forEach((cmd) => commandApi.unregisterCommand(cmd.id));
    };
  }, [editor, commands, methods, onReady]);

  useEffect(() => {
    const commandPaletteExtension = extensions.find(
      (ext: any) => ext.name === "commandPalette",
    ) as CommandPaletteExtension | undefined;

    if (!commandPaletteExtension || !commandPaletteExtension.subscribe) return;

    return commandPaletteExtension.subscribe((isOpen, items) => {
      setCommandPaletteState({ isOpen, commands: items });
    });
  }, [extensions]);

  const handleModeChange = async (newMode: ExtensiveEditorMode) => {
    if (mode === "markdown" && newMode !== "markdown" && hasExtension("markdown")) {
      await commands.importFromMarkdown(content.markdown, { immediate: true });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (mode === "html" && newMode !== "html" && hasExtension("html")) {
      await commands.importFromHTML(content.html);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (newMode === "markdown" && mode !== "markdown" && hasExtension("markdown")) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const markdown = commands.exportToMarkdown();
      setContent((prev) => ({ ...prev, markdown }));
    }
    if (newMode === "html" && mode !== "html" && hasExtension("html")) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const html = commands.exportToHTML();
      setContent((prev) => ({ ...prev, html }));
    }

    setMode(newMode);
    if (newMode === "visual") {
      setTimeout(() => editor?.focus(), 100);
    }
  };

  const insertCustomFeatureCard = () => {
    const customCommands = commands as CoreEditorCommands & {
      insertCustomNode?: (payload: Record<string, unknown>) => void;
    };

    customCommands.insertCustomNode?.({
      tag: "Custom",
      title: "Reusable Callout Block",
      description: "Inserted via createCustomNodeExtension and fully managed by headless commands.",
    });
  };

  return (
    <>
      <section className="luthor-extensive-showcase" aria-label="Headless feature coverage">
        <div className="luthor-extensive-showcase__header">
          <h3>Headless Feature Coverage</h3>
          <p>Everything from formatting and media to command palette, draggable blocks, and custom nodes.</p>
        </div>
        <div className="luthor-extensive-showcase__actions" role="group" aria-label="Showcase actions">
          <button className="luthor-showcase-action" onClick={() => commands.importFromMarkdown(FEATURE_DEMO_MARKDOWN, { immediate: true })} type="button">
            Load Full Demo Content
          </button>
          <button className="luthor-showcase-action" onClick={() => commands.showCommandPalette()} type="button">
            Open Command Palette
          </button>
          <button
            className="luthor-showcase-action"
            onClick={insertCustomFeatureCard}
            type="button"
            disabled={!hasExtension("featureCard" as any)}
          >
            Insert Custom Node
          </button>
        </div>
        <div className="luthor-extensive-showcase__groups">
          {HEADLESS_FEATURE_GROUPS.map((group) => (
            <article key={group.title} className="luthor-extensive-showcase__group">
              <h4>{group.title}</h4>
              <div className="luthor-extensive-showcase__chips">
                {group.items.map((item) => {
                  const enabled = hasExtension(item as any);
                  return (
                    <span key={item} className={`luthor-extensive-showcase__chip${enabled ? " is-enabled" : ""}`}>
                      {titleFromExtensionKey(item)}
                    </span>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="luthor-editor-header">
        <ModeTabs mode={mode} onModeChange={handleModeChange} />
        {mode === "visual" && (
          <Toolbar
            commands={commands as CoreEditorCommands}
            hasExtension={(name: string) => hasExtension(name as any)}
            activeStates={activeStates}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onCommandPaletteOpen={() => commands.showCommandPalette()}
            imageUploadHandler={(file) => ((extensiveExtensions.find((ext: any) => ext.name === "image") as any)?.config?.uploadHandler?.(file) ?? Promise.resolve(URL.createObjectURL(file)))}
          />
        )}
      </div>
      <div className="luthor-editor" data-mode={mode}>
        {mode === "visual" && (
          <>
            <div className="luthor-editor-visual-gutter" aria-hidden="true" />
            <RichText
              placeholder="Write anything..."
              classNames={{
                container: "luthor-richtext-container luthor-preset-extensive__container",
                contentEditable: "luthor-content-editable luthor-preset-extensive__content",
                placeholder: "luthor-placeholder luthor-preset-extensive__placeholder",
              }}
            />
          </>
        )}
        {mode !== "visual" && (
          <div className="luthor-source-panel">
            {mode === "html" && (
              <SourceView value={content.html} onChange={(value) => setContent((prev) => ({ ...prev, html: value }))} placeholder="Enter HTML content..." />
            )}
            {mode === "markdown" && (
              <SourceView value={content.markdown} onChange={(value) => setContent((prev) => ({ ...prev, markdown: value }))} placeholder="Enter Markdown content..." />
            )}
          </div>
        )}
      </div>
      <CommandPalette
        isOpen={commandPaletteState.isOpen}
        onClose={() => commands.hideCommandPalette()}
        commands={commandPaletteState.commands}
      />
    </>
  );
}

export interface ExtensiveEditorProps {
  className?: string;
  onReady?: (methods: ExtensiveEditorRef) => void;
  initialTheme?: "light" | "dark";
  defaultContent?: string;
  showDefaultContent?: boolean;
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({ className, onReady, initialTheme = "light", defaultContent, showDefaultContent = true }, ref) => {
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">(initialTheme);
    const isDark = editorTheme === "dark";

    const toggleTheme = () => setEditorTheme(isDark ? "light" : "dark");

    const [methods, setMethods] = useState<ExtensiveEditorRef | null>(null);
    useImperativeHandle(ref, () => methods as ExtensiveEditorRef, [methods]);

    const welcomeContent = `# Extensive Preset: Complete Headless Demo

**Build amazing React-based rich text editors with ease**

Luthor is a modern, type-safe React framework built on top of Meta's Lexical that makes creating powerful text editors simple and enjoyable.

## ✅ Included Feature Surface

- 🚀 Lightning Fast - Optimized performance with minimal bundle size
- 🛡️ Type-Safe - Full TypeScript support with auto-completion
- 🧩 Extensible - built-in extensions + custom nodes
- 🎨 Customizable - Framework-agnostic styling with CSS custom properties

### Try these in the canvas

- Select text to trigger floating toolbar
- Right-click in the editor for context menu
- Drag blocks using drag handles
- Insert image, table, HTML embed, and custom feature card
- Insert a horizontal rule from toolbar or type --- then space
- Open Command Palette with Ctrl+Shift+P
- Switch between Visual, HTML, and Markdown tabs to verify import/export

## 📝 Try It Out

Start typing or use the toolbar above to format your text. Press \`Cmd+Shift+P\` (Mac) or \`Ctrl+Shift+P\` (Windows/Linux) to open the command palette.`;

    const handleReady = (m: ExtensiveEditorRef) => {
      setMethods(m);
      // Auto-inject default welcome content if enabled
      if (showDefaultContent && defaultContent === undefined) {
        m.injectMarkdown(welcomeContent);
      } else if (defaultContent) {
        m.injectMarkdown(defaultContent);
      }
      onReady?.(m);
    };

    return (
      <div className={`luthor-preset luthor-preset-extensive luthor-editor-wrapper ${className || ""}`} data-editor-theme={editorTheme}>
        <Provider extensions={extensiveExtensions}>
          <ExtensiveEditorContent isDark={isDark} toggleTheme={toggleTheme} onReady={handleReady} />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";
