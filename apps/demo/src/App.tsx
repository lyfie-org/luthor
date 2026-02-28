import {
  ChatWindowEditor,
  EmailComposeEditor,
  ExtensiveEditor,
  HeadlessEditorPreset,
  MDTextEditor,
  NotionLikeEditor,
  NotesEditor,
  RichTextBoxEditor,
  SimpleTextEditor,
} from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useMemo, useState } from "react";
import { useDemoTheme } from "./hooks/useDemoTheme";
import "highlight.js/styles/github.css";

type PresetId =
  | "extensive"
  | "simple-text"
  | "rich-text-box"
  | "chat-window"
  | "email-compose"
  | "md-text"
  | "notion-like"
  | "headless-editor"
  | "notes";

const PRESET_OPTIONS: Array<{ value: PresetId; label: string }> = [
  { value: "extensive", label: "Extensive" },
  { value: "simple-text", label: "Simple Text" },
  { value: "rich-text-box", label: "Rich Text Box" },
  { value: "chat-window", label: "Chat Window" },
  { value: "email-compose", label: "Email Compose" },
  { value: "md-text", label: "MD Text" },
  { value: "notion-like", label: "Notion Like" },
  { value: "headless-editor", label: "Headless" },
  { value: "notes", label: "Notes" },
];

function App() {
  const { theme, toggleTheme } = useDemoTheme();
  const [preset, setPreset] = useState<PresetId>("extensive");

  const presetNode = useMemo(() => {
    switch (preset) {
      case "simple-text":
        return <SimpleTextEditor showDefaultContent={false} placeholder="Simple text only..." />;
      case "rich-text-box":
        return <RichTextBoxEditor showDefaultContent={false} compactToolbar placeholder="Short rich text..." />;
      case "chat-window":
        return <ChatWindowEditor
          placeholder="Type a message"
          maxHeight={250}
          minHeight={150}
          submitOnEnter={false}
          showBottomToolbar
          toolbarButtons={[
            { id: 'attachment', content: 'Attach', ariaLabel: 'Attach file', onClick: () => {} },
            { id: 'image', content: 'Image', ariaLabel: 'Add image', onClick: () => {} },
          ]}
          sendButtonPlacement="inside"
          outputFormat="md"
          formattingOptions={{ bold: true, italic: true, strikethrough: true }}
          onSend={({ format, text, markdown, json }) => {
            console.log("chat-send", { format, text });
            // Full payload available if needed:
            // console.log({ format, text, markdown, json });
          }}
        />
      case "email-compose":
        return <EmailComposeEditor showDefaultContent={false} showCc showSubject />;
      case "md-text":
        return <MDTextEditor showDefaultContent={false} />;
      case "notion-like":
        return <NotionLikeEditor showDefaultContent={false} />;
      case "headless-editor":
        return <HeadlessEditorPreset />;
      case "notes":
        return <NotesEditor showDefaultContent={false} />;
      default:
        return (
          <ExtensiveEditor            
            placeholder={{
              visual: "Write your story...",
              json: "Paste JSON document...",
            }}
            toolbarAlignment="center"
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
          <div className="editor-frame">{presetNode}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
