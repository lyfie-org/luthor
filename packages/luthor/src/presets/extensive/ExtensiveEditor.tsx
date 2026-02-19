import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import { extensiveExtensions, setFloatingToolbarContext } from "./extensions";
import {
  CommandPalette,
  SlashCommandMenu,
  commandsToCommandPaletteItems,
  commandsToSlashCommandItems,
  formatHTMLSource,
  formatJSONBSource,
  formatMarkdownSource,
  ModeTabs,
  registerKeyboardShortcuts,
  SourceView,
  Toolbar,
  type CoreEditorCommands,
} from "../../core";
import type { CommandPaletteExtension, SlashCommandExtension } from "@lyfie/luthor-headless";
import "./styles.css";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export type ExtensiveEditorMode = "visual" | "html" | "markdown" | "jsonb";

export interface ExtensiveEditorRef {
  injectMarkdown: (content: string) => void;
  injectHTML: (content: string) => void;
  injectJSONB: (content: string) => void;
  getMarkdown: () => string;
  getHTML: () => string;
  getJSONB: () => string;
}

function ExtensiveEditorContent({
  isDark,
  toggleTheme,
  placeholder,
  initialMode,
  availableModes,
  onReady,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  placeholder: string;
  initialMode: ExtensiveEditorMode;
  availableModes: readonly ExtensiveEditorMode[];
  onReady?: (methods: ExtensiveEditorRef) => void;
}) {
  const {
    commands,
    hasExtension,
    activeStates,
    lexical: editor,
    extensions,
    export: exportApi,
    import: importApi,
  } = useEditor();
  const [mode, setMode] = useState<ExtensiveEditorMode>(initialMode);
  const [content, setContent] = useState({ html: "", markdown: "", jsonb: "" });
  const [commandPaletteState, setCommandPaletteState] = useState({
    isOpen: false,
    commands: [] as ReturnType<typeof commandsToCommandPaletteItems>,
  });
  const [slashCommandState, setSlashCommandState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    commands: [] as ReturnType<typeof commandsToSlashCommandItems>,
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
      injectJSONB: (value: string) => {
        setTimeout(() => {
          try {
            const parsed = JSON.parse(value);
            importApi.fromJSON(parsed);
          } catch {
            return;
          }
        }, 100);
      },
      getMarkdown: () => commandsRef.current.exportToMarkdown(),
      getHTML: () => commandsRef.current.exportToHTML(),
      getJSONB: () => formatJSONBSource(JSON.stringify(exportApi.toJSON())),
    }),
    [editor, exportApi, importApi],
  );

  useEffect(() => {
    if (!editor || !commands) return;

    const commandApi = commands as CoreEditorCommands;
    const paletteItems = commandsToCommandPaletteItems(commandApi);
    paletteItems.forEach((cmd) => commandApi.registerCommand(cmd));
    const slashItems = commandsToSlashCommandItems(commandApi);
    slashItems.forEach((cmd) => commandApi.registerSlashCommand?.(cmd));

    const unregisterShortcuts = registerKeyboardShortcuts(commandApi, document.body);

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      paletteItems.forEach((cmd) => commandApi.unregisterCommand(cmd.id));
      slashItems.forEach((cmd) => commandApi.unregisterSlashCommand?.(cmd.id));
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

  useEffect(() => {
    const slashCommandExtension = extensions.find(
      (ext: any) => ext.name === "slashCommand",
    ) as SlashCommandExtension | undefined;

    if (!slashCommandExtension || !slashCommandExtension.subscribe) return;

    return slashCommandExtension.subscribe((state) => {
      setSlashCommandState({
        isOpen: state.isOpen,
        query: state.query,
        position: state.position,
        commands: state.commands,
      });
    });
  }, [extensions]);

  const handleModeChange = async (newMode: ExtensiveEditorMode) => {
    if (!availableModes.includes(newMode)) {
      return;
    }

    if (mode === "markdown" && newMode !== "markdown" && hasExtension("markdown")) {
      await commands.importFromMarkdown(content.markdown, { immediate: true });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (mode === "html" && newMode !== "html" && hasExtension("html")) {
      await commands.importFromHTML(content.html);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (mode === "jsonb" && newMode !== "jsonb") {
      try {
        const parsed = JSON.parse(content.jsonb);
        importApi.fromJSON(parsed);
      } catch {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (newMode === "markdown" && mode !== "markdown" && hasExtension("markdown")) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const markdown = formatMarkdownSource(commands.exportToMarkdown());
      setContent((prev) => ({ ...prev, markdown }));
    }
    if (newMode === "html" && mode !== "html" && hasExtension("html")) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const html = formatHTMLSource(commands.exportToHTML());
      setContent((prev) => ({ ...prev, html }));
    }
    if (newMode === "jsonb" && mode !== "jsonb") {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const jsonb = formatJSONBSource(JSON.stringify(exportApi.toJSON()));
      setContent((prev) => ({ ...prev, jsonb }));
    }

    setMode(newMode);
    if (newMode === "visual") {
      setTimeout(() => editor?.focus(), 100);
    }
  };

  return (
    <>
      <div className="luthor-editor-header">
        <ModeTabs mode={mode} onModeChange={handleModeChange} availableModes={availableModes} />
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
              placeholder={placeholder}
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
            {mode === "jsonb" && (
              <SourceView value={content.jsonb} onChange={(value) => setContent((prev) => ({ ...prev, jsonb: value }))} placeholder="Enter JSONB document content..." />
            )}
          </div>
        )}
      </div>
      <CommandPalette
        isOpen={commandPaletteState.isOpen}
        onClose={() => commands.hideCommandPalette()}
        commands={commandPaletteState.commands}
      />
      <SlashCommandMenu
        isOpen={slashCommandState.isOpen}
        query={slashCommandState.query}
        position={slashCommandState.position}
        commands={slashCommandState.commands}
        onClose={() => commands.closeSlashMenu?.()}
        onExecute={(commandId) => {
          commands.executeSlashCommand?.(commandId);
        }}
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
  placeholder?: string;
  initialMode?: ExtensiveEditorMode;
  availableModes?: readonly ExtensiveEditorMode[];
  variantClassName?: string;
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({ className, onReady, initialTheme = "light", defaultContent, showDefaultContent = true, placeholder = "Write anything...", initialMode = "visual", availableModes = ["visual", "html", "markdown", "jsonb"], variantClassName }, ref) => {
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">(initialTheme);
    const isDark = editorTheme === "dark";
    const resolvedInitialMode = availableModes.includes(initialMode)
      ? initialMode
      : (availableModes[0] ?? "visual");

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
- Insert image, table, iframe/YouTube embeds, and custom feature card
- Insert a horizontal rule from toolbar or type --- then space
- Open Command Palette with Ctrl+Shift+P
- Type / in the editor to open the slash command block menu
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
      <div className={`luthor-preset luthor-preset-extensive luthor-editor-wrapper ${variantClassName || ""} ${className || ""}`.trim()} data-editor-theme={editorTheme}>
        <Provider extensions={extensiveExtensions}>
          <ExtensiveEditorContent
            isDark={isDark}
            toggleTheme={toggleTheme}
            placeholder={placeholder}
            initialMode={resolvedInitialMode}
            availableModes={availableModes}
            onReady={handleReady}
          />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";
