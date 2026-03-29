/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  ComposeEditor,
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  HeadlessEditorPreset,
  HTMLEditor,
  LegacyRichEditor,
  MarkDownEditor,
  SimpleEditor,
  SlashEditor,
} from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_COMPOSE_CONTENT,
  DEMO_EXTENSIVE_CONTENT,
  DEMO_HEADLESS_PRESET_CONTENT,
  DEMO_HTML_EDITOR_CONTENT,
  DEMO_LEGACY_RICH_CONTENT,
  DEMO_MD_EDITOR_CONTENT,
  DEMO_SIMPLE_EDITOR_CONTENT,
  DEMO_SLASH_EDITOR_CONTENT,
} from "./demo-content";
import { useDemoTheme } from "./hooks/useDemoTheme";

type PresetId =
  | "extensive"
  | "compose"
  | "simple-editor"
  | "legacy-rich"
  | "md-editor"
  | "html-editor"
  | "slash-editor"
  | "headless-editor";
type SyntaxFlavor = "default" | "custom" | "disabled";

const PRESET_OPTIONS: Array<{ value: PresetId; label: string }> = [
  { value: "extensive", label: "Extensive Editor" },
  { value: "compose", label: "Compose Editor" },
  { value: "simple-editor", label: "Simple Editor" },
  { value: "legacy-rich", label: "Legacy Rich Editor" },
  { value: "md-editor", label: "MD Editor" },
  { value: "html-editor", label: "HTML Editor" },
  { value: "slash-editor", label: "Slash Editor" },
  { value: "headless-editor", label: "Headless Editor" },
];

function App() {
  const { theme, toggleTheme } = useDemoTheme();
  const [preset, setPreset] = useState<PresetId>("extensive");
  const [syntaxFlavor, setSyntaxFlavor] = useState<SyntaxFlavor>("default");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const extensiveEditorRef = useRef<ExtensiveEditorRef | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, []);

  const syntaxThemeColors = useMemo(
    () => ({
      light: {
        comment: "#6a737d",
        keyword: "#a626a4",
        string: "#50a14f",
        number: "#986801",
        function: "#4078f2",
        variable: "#e45649",
      },
      dark: {
        comment: "#6272a4",
        keyword: "#ff79c6",
        string: "#50fa7b",
        number: "#bd93f9",
        function: "#8be9fd",
        variable: "#ffb86c",
      },
    }),
    [],
  );

  const syntaxPresetProps = useMemo<
    Pick<
      ExtensiveEditorProps,
      "isSyntaxHighlightingEnabled" | "syntaxHighlightColorMode" | "syntaxHighlightColors"
    >
  >(
    () => ({
      isSyntaxHighlightingEnabled: syntaxFlavor !== "disabled",
      syntaxHighlightColorMode: syntaxFlavor === "custom" ? "custom" : "lexical",
      syntaxHighlightColors: syntaxFlavor === "custom" ? syntaxThemeColors : undefined,
    }),
    [syntaxFlavor, syntaxThemeColors],
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 1800);
  };

  const handleSave = () => {
    const methods = extensiveEditorRef.current;
    if (!methods) {
      console.log("demo-save-snapshot-unavailable", { preset });
      showToast("Save unavailable for this preset.");
      return;
    }

    const snapshot = {
      syntaxFlavor,
      json: methods.getJSON(),
      markdown: methods.getMarkdown(),
      html: methods.getHTML(),
    };

    console.log("demo-save-snapshot", snapshot);
    showToast("Done. Printed to console log.");
  };

  const presetNode = useMemo(() => {
    switch (preset) {
      case "compose":
        return (
          <ComposeEditor
            {...syntaxPresetProps}
            defaultContent={DEMO_COMPOSE_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
            compactToolbar
            placeholder="Write a draft..."
          />
        );
      case "simple-editor":
        return (
          <SimpleEditor
            defaultContent={DEMO_SIMPLE_EDITOR_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
            placeholder="Type a message"
            maxHeight={220}
            minHeight={140}
            submitOnEnter={false}
            showBottomToolbar={false}
            sendButtonPlacement="inside"
            outputFormat="md"
            formattingOptions={{ bold: true, italic: true, strikethrough: true }}
            onSend={({ format, text }) => {
              console.log("simple-editor-send", { format, text });
            }}
          />
        );
      case "legacy-rich":
        return (
          <LegacyRichEditor
            {...syntaxPresetProps}
            defaultContent={DEMO_LEGACY_RICH_CONTENT}
            showDefaultContent={false}
            defaultEditorView="markdown"
            initialTheme={theme}
          />
        );
      case "md-editor":
        return (
          <MarkDownEditor
            {...syntaxPresetProps}
            defaultContent={DEMO_MD_EDITOR_CONTENT}
            showDefaultContent={false}
            defaultEditorView="markdown"
            initialTheme={theme}
          />
        );
      case "html-editor":
        return (
          <HTMLEditor
            {...syntaxPresetProps}
            defaultContent={DEMO_HTML_EDITOR_CONTENT}
            showDefaultContent={false}
            defaultEditorView="html"
            initialTheme={theme}
          />
        );
      case "slash-editor":
        return (
          <SlashEditor
            {...syntaxPresetProps}
            defaultContent={DEMO_SLASH_EDITOR_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
          />
        );
      case "headless-editor":
        return (
          <HeadlessEditorPreset
            {...syntaxPresetProps}
            defaultContent={DEMO_HEADLESS_PRESET_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
          />
        );
      default:
        return (
          <ExtensiveEditor
            ref={extensiveEditorRef}
            {...syntaxPresetProps}
            defaultContent={DEMO_EXTENSIVE_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
            placeholder={{
              visual: "Write your story...",
              json: "Paste JSON document...",
            }}
            toolbarAlignment="center"
            maxListIndentation={15}
            isToolbarPinned={true}
            availableModes={["visual-only", "visual-editor", "json", "markdown", "html"]}
            initialMode="visual-only"
            editOnClick={false}
          />
        );
    }
  }, [preset, syntaxPresetProps, theme]);

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="app-layout">
        <header className="app-header">
          <div className="control-group">
            <label className="control-label" htmlFor="preset-select">
              Preset
            </label>
            <div className="control-row">
              <select
                id="preset-select"
                className="preset-select"
                value={preset}
                onChange={(event) => setPreset(event.target.value as PresetId)}
              >
                {PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="save-button"
                type="button"
                onClick={handleSave}
                disabled={preset !== "extensive"}
              >
                Save
              </button>
            </div>
          </div>
          <div className="control-group">
            <label className="control-label" htmlFor="syntax-flavor-select">
              Syntax
            </label>
            <div className="control-row">
              <select
                id="syntax-flavor-select"
                className="preset-select"
                value={syntaxFlavor}
                onChange={(event) => setSyntaxFlavor(event.target.value as SyntaxFlavor)}
              >
                <option value="default">Default colors</option>
                <option value="custom">Custom colors</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </header>

        <main className="editor-stage">
          <div className="editor-frame">
            <div className="demo-editor-host">{presetNode}</div>
          </div>
        </main>
      </div>
      {toastMessage ? (
        <div className="demo-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

export default App;
