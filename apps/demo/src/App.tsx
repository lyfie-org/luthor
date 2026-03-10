import {
  ComposeEditor,
  ComposerEditor,
  ExtensiveEditor,
  HeadlessEditorPreset,
  HTMLEditor,
  MDEditor,
  SlashEditor,
} from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useMemo, useState } from "react";
import { useDemoTheme } from "./hooks/useDemoTheme";
import "highlight.js/styles/github.css";

type PresetId =
  | "extensive"
  | "compose"
  | "composer"
  | "md-editor"
  | "html-editor"
  | "slash-editor"
  | "headless-editor";

const PRESET_OPTIONS: Array<{ value: PresetId; label: string }> = [
  { value: "extensive", label: "Extensive Editor" },
  { value: "compose", label: "Rich Text Input" },
  { value: "composer", label: "Simple Text Input" },
  { value: "md-editor", label: "MD Editor" },
  { value: "html-editor", label: "HTML Editor" },
  { value: "slash-editor", label: "Slash Editor" },
  { value: "headless-editor", label: "Headless Editor" },
];

function App() {
  const { theme, toggleTheme } = useDemoTheme();
  const [preset, setPreset] = useState<PresetId>("extensive");

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
      case "composer":
        return (
          <ComposerEditor
            placeholder="Type a message"
            maxHeight={220}
            minHeight={140}
            submitOnEnter={false}
            showBottomToolbar={false}
            sendButtonPlacement="inside"
            outputFormat="md"
            formattingOptions={{ bold: true, italic: true, strikethrough: true }}
            onSend={({ format, text }) => {
              console.log("composer-send", { format, text });
            }}
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
            placeholder={{
              visual: "Write your story...",
              json: "Paste JSON document...",
            }}
            toolbarAlignment="center"
            maxListIndentation={15}
            isToolbarPinned={true}
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
