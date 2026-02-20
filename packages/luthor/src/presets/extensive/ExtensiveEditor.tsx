import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import { extensiveExtensions, setFloatingToolbarContext } from "./extensions";
import {
  CommandPalette,
  SlashCommandMenu,
  EmojiSuggestionMenu,
  commandsToCommandPaletteItems,
  commandsToSlashCommandItems,
  formatJSONBSource,
  ModeTabs,
  registerKeyboardShortcuts,
  SourceView,
  Toolbar,
  TRADITIONAL_TOOLBAR_LAYOUT,
  type CoreEditorCommands,
  type ToolbarLayout,
} from "../../core";
import { EXTENSIVE_WELCOME_CONTENT_JSONB as extensiveWelcomeContent } from "./welcomeContent";
import type { CommandPaletteExtension, SlashCommandExtension, EmojiExtension, EmojiCatalogItem } from "@lyfie/luthor-headless";
import "./styles.css";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

export type ExtensiveEditorMode = "visual" | "jsonb";

export interface ExtensiveEditorRef {
  injectJSONB: (content: string) => void;
  getJSONB: () => string;
}

type JsonTextNode = {
  type: "text";
  version: 1;
  text: string;
  detail: 0;
  format: 0;
  mode: "normal";
  style: "";
};

type JsonParagraphNode = {
  type: "paragraph";
  version: 1;
  format: "";
  indent: 0;
  direction: null;
  children: JsonTextNode[];
};

type JsonbDocument = {
  root: {
    type: "root";
    version: 1;
    format: "";
    indent: 0;
    direction: null;
    children: JsonParagraphNode[];
  };
};

function createJSONBDocumentFromText(content: string): JsonbDocument {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0);

  const children = (blocks.length > 0 ? blocks : [""]).map<JsonParagraphNode>((block) => ({
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "text",
        version: 1,
        text: block,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  }));

  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children,
    },
  };
}

function toJSONBInput(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify(createJSONBDocumentFromText(value));
  }
}

function ExtensiveEditorContent({
  isDark,
  toggleTheme,
  placeholder,
  initialMode,
  availableModes,
  onReady,
  toolbarLayout,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  placeholder: string;
  initialMode: ExtensiveEditorMode;
  availableModes: readonly ExtensiveEditorMode[];
  onReady?: (methods: ExtensiveEditorRef) => void;
  toolbarLayout?: ToolbarLayout;
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
  const [content, setContent] = useState({ jsonb: "" });
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
  const readyRef = useRef(false);
  
  // Lazy conversion state: track which formats are valid cache
  const cacheValidRef = useRef<Set<ExtensiveEditorMode>>(new Set(["visual"]));
  const editorChangeCountRef = useRef(0);

  useEffect(() => {
    setFloatingToolbarContext(commands, activeStates, isDark ? "dark" : "light");
  }, [commands, activeStates, isDark]);

  const methods = useMemo<ExtensiveEditorRef>(
    () => ({
      injectJSONB: (value: string) => {
        setTimeout(() => {
          try {
            const parsed = JSON.parse(value);
            importApi.fromJSON(parsed);
          } catch (error) {
            console.error("Failed to inject JSONB:", error);
            return;
          }
        }, 100);
      },
      getJSONB: () => formatJSONBSource(JSON.stringify(exportApi.toJSON())),
    }),
    [exportApi, importApi],
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
      if (mode === "jsonb" && newMode !== "jsonb") {
        const parsed = JSON.parse(content.jsonb);
        importApi.fromJSON(parsed);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Immediately switch mode so UI shows new view
      setMode(newMode);

      // Step 2: Lazy export - only convert format if not cached
      // This ensures smooth tab switching with progressive conversion
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
            layout={toolbarLayout ?? TRADITIONAL_TOOLBAR_LAYOUT}
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
                  <strong>Invalid JSONB</strong>
                  <p>{sourceError.error}</p>
                  <small>Fix the errors above and try switching modes again</small>
                </div>
              </div>
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
  toolbarLayout?: ToolbarLayout;
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({ className, onReady, initialTheme = "light", defaultContent, showDefaultContent = true, placeholder = "Write anything...", initialMode = "visual", availableModes = ["visual", "jsonb"], variantClassName, toolbarLayout }, ref) => {
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

    const handleReady = (m: ExtensiveEditorRef) => {
      setMethods(m);
      // Auto-inject default welcome content if enabled
      if (showDefaultContent && defaultContent === undefined) {
        m.injectJSONB(JSON.stringify(extensiveWelcomeContent));
      } else if (defaultContent) {
        m.injectJSONB(toJSONBInput(defaultContent));
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
            toolbarLayout={toolbarLayout}
          />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";
