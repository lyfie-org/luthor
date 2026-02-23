import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useDemoTheme } from "./hooks/useDemoTheme";
import "highlight.js/styles/github.css";

function App() {
  const { theme, toggleTheme } = useDemoTheme();

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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ExtensiveEditor
          initialTheme={theme}
          syntaxHighlighting="auto"
          toolbarPosition="top"
          toolbarAlignment="center"
          toolbarVisibility={{ fontFamily: true }}
          toolbarClassName="docs-toolbar"
          quoteClassName="docs-quote"
          quoteStyleVars={{
            "--luthor-quote-bg": "#fff7ed",
            "--luthor-quote-fg": "#7c2d12",
            "--luthor-quote-border": "#ea580c",
          }}
          fontFamilyOptions={fontFamilyOptions}
          fontSizeOptions={[
            { value: "default", label: "Default", fontSize: "inherit" },
            { value: "13", label: "13px", fontSize: "13px" },
            { value: "17", label: "17px", fontSize: "17px" },
            { value: "21", label: "21px", fontSize: "21px" },
          ]}
          minimumDefaultLineHeight={1}
          lineHeightOptions={[
            { value: "default", label: "Default", lineHeight: "normal" },
            { value: "1", label: "1.0", lineHeight: "1" },
            { value: "1.15", label: "1.15", lineHeight: "1.15" },
            { value: "1.5", label: "1.5", lineHeight: "1.5" },
            { value: "1.75", label: "1.75", lineHeight: "1.75" },
            { value: "2", label: "2.0", lineHeight: "2" },
          ]}
          paragraphLabel="Normal"
          headingOptions={["h1", "h2", "h3"]}
          scaleByRatio={false}
          slashCommandVisibility={[
            { "block.quote": true },
            { "block.paragraph": true },
            { "block.heading1": true },
          ]}
          isCopyAllowed={true}
          placeholder={{
            visual: "Write your story...",
            jsonb: "Paste JSONB document...",
          }}
          isDraggableBoxEnabled={true}
          defaultSettings={{
            link: { color: "#1d4ed8" },
            list: { markerColor: "#1f2937", checkboxColor: "#2563eb" },
            table: { borderColor: "#cbd5e1", headerBackgroundColor: "#f1f5f9" },
            hr: { color: "#cbd5e1" },
            placeholder: { color: "#94a3b8" },
            toolbar: { backgroundColor: "#f8fafc" },
          }}
          commandPaletteShortcutOnly={false}
          shortcutConfig={{
            disabledCommandIds: ["format.italic", "format.bold"],
            bindings: {
              "format.bold": { key: "m", ctrlKey: true },
              "palette.show": [
                { key: "k", ctrlKey: true, shiftKey: true },
              ],
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
