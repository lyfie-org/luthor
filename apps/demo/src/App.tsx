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
    methods.injectMarkdown(`# Welcome to Luthor

**Build amazing React-based rich text editors with ease**

Luthor is a modern, type-safe React framework built on top of Meta's Lexical that makes creating powerful text editors simple and enjoyable.

## ✨ Key Features

- 🚀 **Lightning Fast** - Optimized performance with minimal bundle size
- 🛡️ **Type-Safe** - Full TypeScript support with auto-completion
- 🧩 **Extensible** - 25+ built-in extensions for common features
- 🎨 **Customizable** - Framework-agnostic styling with CSS custom properties
- 📱 **Responsive** - Works perfectly on all devices

## 🏁 Quick Start

\`\`\`bash
npm install @lyfie/luthor-headless lexical @lexical/react
\`\`\`

That's it! You're ready to build something amazing.`);
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
