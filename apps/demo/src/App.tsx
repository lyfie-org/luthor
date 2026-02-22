// ...existing code...
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";
import { useDemoTheme } from "./hooks/useDemoTheme";

function App() {
  const { theme, toggleTheme } = useDemoTheme();
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
          fontFamilyOptions={[
            { value: "default", label: "Default", fontFamily: "inherit" },
            {
              value: "geist",
              label: "Geist",
              fontFamily: "'Geist', 'Segoe UI', Arial, sans-serif",
              cssImportUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&display=swap",
            },
          ]}
          />
      </div>
    </div>
  );
}

export default App;
