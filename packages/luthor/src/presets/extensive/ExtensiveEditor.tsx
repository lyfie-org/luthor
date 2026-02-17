import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import type { LexicalEditor } from "lexical";
import { extensiveExtensions, setFloatingToolbarContext } from "./extensions";
import { commandsToCommandPaletteItems, registerKeyboardShortcuts } from "./commands";
import { Toolbar } from "./components/Toolbar";
import { CommandPalette } from "./components/CommandPalette";
import type { CommandPaletteExtension } from "@lyfie/luthor-headless";
import "./styles.css";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

type EditorCommands = Record<string, any>;
type EditorStateQueries = Record<string, any>;

export type ExtensiveEditorMode = "visual" | "html" | "markdown";

export interface ExtensiveEditorRef {
  injectMarkdown: (content: string) => void;
  injectHTML: (content: string) => void;
  getMarkdown: () => string;
  getHTML: () => string;
}

function ModeTabs({
  mode,
  onModeChange,
}: {
  mode: ExtensiveEditorMode;
  onModeChange: (mode: ExtensiveEditorMode) => void;
}) {
  return (
    <div className="luthor-mode-tabs">
      <button className={`luthor-mode-tab ${mode === "visual" ? "active" : ""}`} onClick={() => onModeChange("visual")}>
        Visual
      </button>
      <button className={`luthor-mode-tab ${mode === "html" ? "active" : ""}`} onClick={() => onModeChange("html")}>
        HTML
      </button>
      <button className={`luthor-mode-tab ${mode === "markdown" ? "active" : ""}`} onClick={() => onModeChange("markdown")}>
        Markdown
      </button>
    </div>
  );
}

function SourceView({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      className="luthor-source-view"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}

function ExtensiveEditorContent({
  className,
  isDark,
  toggleTheme,
  onReady,
}: {
  className?: string;
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
  const commandsRef = useRef<EditorCommands>(commands);
  const readyRef = useRef(false);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    setFloatingToolbarContext(commands, activeStates);
  }, [commands, activeStates]);

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

    const paletteItems = commandsToCommandPaletteItems(commands);
    paletteItems.forEach((cmd) => commands.registerCommand(cmd));

    const unregisterShortcuts = registerKeyboardShortcuts(commands, document.body);

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      paletteItems.forEach((cmd) => commands.unregisterCommand(cmd.id));
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

  return (
    <>
      <div className="luthor-editor-header">
        <ModeTabs mode={mode} onModeChange={handleModeChange} />
        {mode === "visual" && (
          <Toolbar
            commands={commands}
            hasExtension={hasExtension}
            activeStates={activeStates}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onCommandPaletteOpen={() => commands.showCommandPalette()}
            editor={editor as LexicalEditor | null}
          />
        )}
      </div>
      <div className="luthor-editor" data-mode={mode}>
        {mode === "visual" && (
          <RichText
            placeholder="Write anything..."
            classNames={{
              container: "luthor-richtext-container",
              contentEditable: "luthor-content-editable",
              placeholder: "luthor-placeholder",
            }}
          />
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
}

export const ExtensiveEditor = forwardRef<ExtensiveEditorRef, ExtensiveEditorProps>(
  ({ className, onReady, initialTheme = "light" }, ref) => {
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">(initialTheme);
    const isDark = editorTheme === "dark";

    const toggleTheme = () => setEditorTheme(isDark ? "light" : "dark");

    const [methods, setMethods] = useState<ExtensiveEditorRef | null>(null);
    React.useImperativeHandle(ref, () => methods as ExtensiveEditorRef, [methods]);

    const handleReady = (m: ExtensiveEditorRef) => {
      setMethods(m);
      onReady?.(m);
    };

    return (
      <div className={`luthor-editor-wrapper ${className || ""}`} data-editor-theme={editorTheme}>
        <Provider extensions={extensiveExtensions}>
          <ExtensiveEditorContent className={className} isDark={isDark} toggleTheme={toggleTheme} onReady={handleReady} />
        </Provider>
      </div>
    );
  },
);

ExtensiveEditor.displayName = "ExtensiveEditor";
