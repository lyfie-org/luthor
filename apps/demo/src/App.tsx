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

function App() {
  const { theme, toggleTheme } = useDemoTheme();
  const [preset, setPreset] = useState("extensive");

  const fontFamilyOptions = [
    { value: "default", label: "Default", fontFamily: "inherit" },
    {
      value: "geist",
      label: "Geist",
      fontFamily: "'Geist', 'Segoe UI', Arial, sans-serif",
      cssImportUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&display=swap",
    },
    {
      value: "comfortaa",
      label: "Comfortaa",
      fontFamily: "'Comfortaa', 'Segoe UI', Arial, sans-serif",
      cssImportUrl: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap",
    },
  ];
  const presetNode = useMemo(() => {
    switch (preset) {
      case "simple-text":
        return <SimpleTextEditor showDefaultContent={false} placeholder="Simple text only..." />;
      case "rich-text-box":
        return <RichTextBoxEditor showDefaultContent={false} compactToolbar placeholder="Short rich text..." />;
      case "chat-window":
        return <ChatWindowEditor showDefaultContent={false} onSend={(payload) => console.log("chat send", payload)} />;
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
  }, [fontFamilyOptions, preset, theme]);

  return (
    <div className="app-shell" data-theme={theme}>
      <button
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: theme === "dark" ? "#222" : "#eee",
          color: theme === "dark" ? "#fff" : "#222",
          cursor: "pointer",
          fontWeight: 600,
        }}
        onClick={toggleTheme}
      >
        {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
      </button>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <select
          value={preset}
          onChange={(event) => setPreset(event.target.value)}
          style={{ height: 36, borderRadius: 8, padding: "0 10px" }}
        >
          <option value="extensive">Extensive</option>
          <option value="simple-text">Simple Text</option>
          <option value="rich-text-box">Rich Text Box</option>
          <option value="chat-window">Chat Window</option>
          <option value="email-compose">Email Compose</option>
          <option value="md-text">MD Text</option>
          <option value="notion-like">Notion Like</option>
          <option value="headless-editor">Headless</option>
          <option value="notes">Notes</option>
        </select>
        {presetNode}
      </div>
    </div>
  );
}

export default App;
