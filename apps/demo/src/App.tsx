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
          />
      </div>
    </div>
  );
}

export default App;
