import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createEditorSystem, RichText, lexicalNodesToEnhancedMarkdown, enhancedMarkdownToLexicalJSON, importHTMLWithCodeSupport } from "@lyfie/luthor-headless";
import { extensiveExtensions, setFloatingToolbarContext } from "./extensions";
import {
  CommandPalette,
  SlashCommandMenu,
  EmojiSuggestionMenu,
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
import type { CommandPaletteExtension, SlashCommandExtension, EmojiExtension, EmojiCatalogItem } from "@lyfie/luthor-headless";
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

/**
 * Helper function to export editor state to enhanced markdown
 * Uses the enhanced markdown convertor to preserve all extension metadata
 */
function exportToEnhancedMarkdown(editorStateJson: any): string {
  try {
    const nodes = editorStateJson?.root?.children || [];
    const enhancedMarkdown = lexicalNodesToEnhancedMarkdown(nodes);
    return formatMarkdownSource(enhancedMarkdown);
  } catch (error) {
    console.error("Error exporting to enhanced markdown:", error);
    return "";
  }
}

/**
 * Helper function to import from enhanced markdown
 * Reconstructs Lexical JSON from enhanced markdown with embedded metadata
 * This preserves all extension node properties (embeds, images, etc.)
 */
function importFromEnhancedMarkdown(markdown: string, importApi: any): void {
  try {
    // Convert enhanced markdown directly back to Lexical JSON
    // This preserves all metadata from LUTHOR_BLOCK comments
    const lexicalJson = enhancedMarkdownToLexicalJSON(markdown);
    importApi.fromJSON(lexicalJson);
  } catch (error) {
    console.error("Error parsing enhanced markdown:", error);
    throw error;
  }
}

/**
 * Helper function to import from enhanced HTML
 * Reconstructs Lexical JSON from HTML with proper handling of code blocks
 * This preserves all code and inline code formatting
 */
async function importFromEnhancedHTML(html: string, editor: any, importApi: any): Promise<void> {
  try {
    // Use the enhanced HTML importer that properly handles code blocks
    await importHTMLWithCodeSupport(html, editor, importApi);
  } catch (error) {
    console.error("Error parsing enhanced HTML:", error);
    throw error;
  }
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
  const [convertingMode, setConvertingMode] = useState<ExtensiveEditorMode | null>(null);
  const [sourceError, setSourceError] = useState<{ mode: ExtensiveEditorMode; error: string } | null>(null);
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
  const [emojiSuggestionState, setEmojiSuggestionState] = useState({
    isOpen: false,
    query: "",
    position: null as { x: number; y: number } | null,
    suggestions: [] as EmojiCatalogItem[],
  });
  const commandsRef = useRef<CoreEditorCommands>(commands as CoreEditorCommands);
  const readyRef = useRef(false);
  
  // Lazy conversion state: track which formats are valid cache
  const cacheValidRef = useRef<Set<ExtensiveEditorMode>>(new Set(["visual"]));
  const editorChangeCountRef = useRef(0);

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
            try {
              importFromEnhancedMarkdown(value, importApi);
            } catch (error) {
              console.error("Failed to inject markdown:", error);
            }
          }
        }, 100);
      },
      injectHTML: (value: string) => {
        setTimeout(() => {
          if (editor) {
            // Use enhanced HTML importer that properly handles code blocks
            importFromEnhancedHTML(value, editor, importApi).catch((error) => {
              console.error("Failed to inject HTML:", error);
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
      getMarkdown: () => {
        // Use enhanced markdown convertor to preserve all extension metadata
        const editorStateJson = exportApi.toJSON();
        return exportToEnhancedMarkdown(editorStateJson);
      },
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

  useEffect(() => {
    const emojiExtension = extensions.find(
      (ext: any) => ext.name === "emoji",
    ) as EmojiExtension | undefined;

    if (!emojiExtension || !emojiExtension.subscribe) return;

    return emojiExtension.subscribe((state) => {
      setEmojiSuggestionState({
        isOpen: state.isOpen,
        query: state.query,
        position: state.position,
        suggestions: state.suggestions,
      });
    });
  }, [extensions]);

  useEffect(() => {
    if (!editor || !exportApi) return;

    const unsubscribe = editor.registerUpdateListener(() => {
      // When visual editor changes, mark all cached formats as stale
      // This prevents stale cache but doesn't do any actual export work
      editorChangeCountRef.current += 1;
      cacheValidRef.current.clear();
      cacheValidRef.current.add("visual"); // visual is always valid (it IS the editor state)
    });

    return unsubscribe;
  }, [editor, exportApi]);

  const handleModeChange = async (newMode: ExtensiveEditorMode) => {
    if (!availableModes.includes(newMode)) {
      return;
    }

    try {
      // Clear any previous errors when attempting to switch modes
      setSourceError(null);

      // Step 1: Import edited content from source tabs
      if (mode === "markdown" && newMode !== "markdown" && hasExtension("markdown")) {
        // Import from enhanced markdown to reconstruct all extension nodes with metadata
        importFromEnhancedMarkdown(content.markdown, importApi);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (mode === "html" && newMode !== "html" && hasExtension("html")) {
        // Use enhanced HTML importer that properly handles code blocks and inline code
        await importFromEnhancedHTML(content.html, editor, importApi);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (mode === "jsonb" && newMode !== "jsonb") {
        const parsed = JSON.parse(content.jsonb);
        importApi.fromJSON(parsed);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Immediately switch mode so UI shows new view
      setMode(newMode);

      // Step 2: Lazy export - only convert format if not cached
      // This ensures smooth tab switching with progressive conversion
      if (newMode === "markdown" && mode !== "markdown" && hasExtension("markdown")) {
        if (!cacheValidRef.current.has("markdown")) {
          setConvertingMode("markdown");
          await new Promise((resolve) => setTimeout(resolve, 50));
          try {
            // Use enhanced markdown convertor to preserve all extension metadata
            const editorStateJson = exportApi.toJSON();
            const markdown = exportToEnhancedMarkdown(editorStateJson);
            setContent((prev) => ({ ...prev, markdown }));
            cacheValidRef.current.add("markdown");
          } finally {
            setConvertingMode(null);
          }
        }
      }

      if (newMode === "html" && mode !== "html" && hasExtension("html")) {
        if (!cacheValidRef.current.has("html")) {
          setConvertingMode("html");
          await new Promise((resolve) => setTimeout(resolve, 50));
          try {
            const html = formatHTMLSource(commands.exportToHTML());
            setContent((prev) => ({ ...prev, html }));
            cacheValidRef.current.add("html");
          } finally {
            setConvertingMode(null);
          }
        }
      }

      if (newMode === "jsonb" && mode !== "jsonb") {
        if (!cacheValidRef.current.has("jsonb")) {
          setConvertingMode("jsonb");
          await new Promise((resolve) => setTimeout(resolve, 50));
          try {
            const jsonb = formatJSONBSource(JSON.stringify(exportApi.toJSON()));
            setContent((prev) => ({ ...prev, jsonb }));
            cacheValidRef.current.add("jsonb");
          } finally {
            setConvertingMode(null);
          }
        }
      }

      if (newMode === "visual") {
        setTimeout(() => editor?.focus(), 100);
      }
    } catch (error) {
      // If an error occurs while importing, show it and keep the user in the current mode
      const errorMessage = error instanceof Error ? error.message : "Invalid format - could not parse content";
      setSourceError({ mode: mode, error: errorMessage });
      // Don't change mode if import fails
    }
  };

  return (
    <>
      <div className="luthor-editor-header">
        <ModeTabs 
          mode={mode} 
          onModeChange={handleModeChange} 
          availableModes={availableModes}
          isConverting={convertingMode}
        />
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
            {sourceError && sourceError.mode === mode && (
              <div className="luthor-source-error">
                <div className="luthor-source-error-icon">⚠️</div>
                <div className="luthor-source-error-message">
                  <strong>Invalid {mode.toUpperCase()}</strong>
                  <p>{sourceError.error}</p>
                  <small>Fix the errors above and try switching modes again</small>
                </div>
              </div>
            )}
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
      <EmojiSuggestionMenu
        isOpen={emojiSuggestionState.isOpen}
        query={emojiSuggestionState.query}
        position={emojiSuggestionState.position}
        suggestions={emojiSuggestionState.suggestions}
        onClose={() => commands.closeEmojiSuggestions?.()}
        onExecute={(emoji) => {
          commands.executeEmojiSuggestion?.(emoji);
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

    useEffect(() => {
      setEditorTheme(initialTheme);
    }, [initialTheme]);

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
