import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useDemoTheme } from "./hooks/useDemoTheme";

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
          ]
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
          lineHeightOptions={[
            { value: "default", label: "Default", lineHeight: "normal" },
            { value: "0.25", label: "0.25", lineHeight: "0.25" },
            { value: "0.5", label: "0.5", lineHeight: "0.5" },
            { value: "1", label: "1.0", lineHeight: "1" },
            { value: "1.25", label: "1.25", lineHeight: "1.25" },
            { value: "1.5", label: "1.5", lineHeight: "1.5" },
            { value: "2", label: "2.0", lineHeight: "2" },
          ]}
          paragraphLabel="Normal"
          headingOptions={['h1', 'h2', 'h3']}
          scaleByRatio={false}
          editorThemeOverrides={{
            "--luthor-bg": theme === "dark" ? "#ea580c" : "#ea580c",
            "--luthor-fg": theme === "dark" ? "#eee" : "#111",
            "--luthor-toolbar-bg": theme === "dark" ? "#333" : "#f9f9f9",
            }}
          />
      </div>
    </div>
  );
}

export default App;
