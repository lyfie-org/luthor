import './App.css'
import { ExtensiveEditor } from "@lyfie/luthor";
import type { ExtensiveEditorRef } from "@lyfie/luthor";
import React from "react";
import "@lyfie/luthor/styles.css";

function App() {
  const editorRef = React.useRef<ExtensiveEditorRef>(null);
  // Handle when editor is ready - inject content immediately
  const handleEditorReady = React.useCallback((methods: ExtensiveEditorRef) => {
    console.log("🎯 Editor ready - injecting content immediately");
    methods.injectMarkdown(`# Welcome to the Luthor Demo!`);
  }, []);

  return (
    <div className="app-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background" />
        <div className="hero-content">          

          {/* Editor Demo */}
          <div className="editor-wrapper">
            <div className="editor-glow" />
            <div className="editor-container">
              <ExtensiveEditor ref={editorRef} onReady={handleEditorReady} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
