import {
  ComposeEditor,
  ExtensiveEditor,
  type ExtensiveEditorRef,
  HeadlessEditorPreset,
  HTMLEditor,
  LegacyRichEditor,
  MDEditor,
  SimpleEditor,
  SlashEditor,
} from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useMemo, useRef, useState } from "react";
import { useDemoTheme } from "./hooks/useDemoTheme";
import "highlight.js/styles/github.css";

type PresetId =
  | "extensive"
  | "compose"
  | "simple-editor"
  | "legacy-rich"
  | "md-editor"
  | "html-editor"
  | "slash-editor"
  | "headless-editor";

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
  const extensiveEditorRef = useRef<ExtensiveEditorRef | null>(null);

  const handleSave = () => {
    const methods = extensiveEditorRef.current;
    if (!methods) {
      console.log("demo-save-snapshot-unavailable", { preset });
      return;
    }

    const snapshot = {
      json: methods.getJSON(),
      markdown: methods.getMarkdown(),
      html: methods.getHTML(),
    };

    console.log("demo-save-snapshot", snapshot);
  };

  const presetNode = useMemo(() => {
    switch (preset) {
      case "compose":
        return (
          <ComposeEditor
            showDefaultContent={false}
            compactToolbar
            placeholder="Write a draft..."
          />
        );
      case "simple-editor":
        return (
          <SimpleEditor
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
            showDefaultContent={false}
            defaultEditorView="markdown"
          />
        );
      case "md-editor":
        return <MDEditor showDefaultContent={false} />;
      case "html-editor":
        return <HTMLEditor showDefaultContent={false} />;
      case "slash-editor":
        return <SlashEditor showDefaultContent={false} />;
      case "headless-editor":
        return <HeadlessEditorPreset />;
      default:
        return (
          <ExtensiveEditor
            ref={extensiveEditorRef}
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
  }, [preset]);

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
    </div>
  );
}

export default App;
