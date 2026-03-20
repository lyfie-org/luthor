import {
  ComposeEditor,
  ExtensiveEditor,
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
type Theme = "light" | "dark";

const PRISM_THEME_LINK_ID = "luthor-prism-theme";

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

function syncPrismTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }

  const href = theme === "dark"
    ? "/prismjs/themes/prism-okaidia.css"
    : "/prismjs/themes/prism.css";
  const existing = document.getElementById(PRISM_THEME_LINK_ID);
  const link = existing instanceof HTMLLinkElement
    ? existing
    : document.createElement("link");

  if (!(existing instanceof HTMLLinkElement)) {
    link.id = PRISM_THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}

function App() {
  const { theme, toggleTheme } = useDemoTheme();
  const [preset, setPreset] = useState<PresetId>("extensive");
  const [activeEditorTheme, setActiveEditorTheme] = useState<Theme>(theme);
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

  useEffect(() => {
    setActiveEditorTheme(theme);
  }, [preset, theme]);

  useEffect(() => {
    syncPrismTheme(activeEditorTheme);
  }, [activeEditorTheme]);

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
            defaultContent={DEMO_COMPOSE_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
            onThemeChange={setActiveEditorTheme}
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
            defaultContent={DEMO_LEGACY_RICH_CONTENT}
            showDefaultContent={false}
            defaultEditorView="markdown"
            initialTheme={theme}
            onThemeChange={setActiveEditorTheme}
          />
        );
      case "md-editor":
        return (
          <MarkDownEditor
            defaultContent={DEMO_MD_EDITOR_CONTENT}
            showDefaultContent={false}
            defaultEditorView="markdown"
            initialTheme={theme}
            onThemeChange={setActiveEditorTheme}
          />
        );
      case "html-editor":
        return (
          <HTMLEditor
            defaultContent={DEMO_HTML_EDITOR_CONTENT}
            showDefaultContent={false}
            defaultEditorView="html"
            initialTheme={theme}
            onThemeChange={setActiveEditorTheme}
          />
        );
      case "slash-editor":
        return (
          <SlashEditor
            defaultContent={DEMO_SLASH_EDITOR_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
          />
        );
      case "headless-editor":
        return (
          <HeadlessEditorPreset
            defaultContent={DEMO_HEADLESS_PRESET_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
          />
        );
      default:
        return (
          <ExtensiveEditor
            ref={extensiveEditorRef}
            defaultContent={DEMO_EXTENSIVE_CONTENT}
            showDefaultContent={false}
            initialTheme={theme}
            onThemeChange={setActiveEditorTheme}
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
  }, [theme, preset]);

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
