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
import { useEffect, useMemo, useRef, useState } from "react";
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
  const demoEditorHostRef = useRef<HTMLDivElement | null>(null);
  const extensiveEditorRef = useRef<ExtensiveEditorRef | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSavedSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (preset !== "extensive") {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      lastAutoSavedSnapshotRef.current = null;
      return;
    }

    const host = demoEditorHostRef.current;
    if (!host) {
      return;
    }

    const scheduleAutoSave = () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const methods = extensiveEditorRef.current;
        if (!methods) {
          return;
        }

        const snapshot = {
          json: methods.getJSON(),
          markdown: methods.getMarkdown(),
          html: methods.getHTML(),
        };
        const snapshotSignature = JSON.stringify(snapshot);
        if (lastAutoSavedSnapshotRef.current === snapshotSignature) {
          return;
        }

        lastAutoSavedSnapshotRef.current = snapshotSignature;

        console.log("extensive-editor-auto-save", snapshot);
      }, 2000);
    };

    const isEditorInteractionTarget = (target: EventTarget | null): target is HTMLElement => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return target.closest(".luthor-editor") !== null;
    };

    let hasUserInteracted = false;

    const handleEditorActivity = (event: Event) => {
      const target = event.target;
      if (!isEditorInteractionTarget(target)) {
        return;
      }

      hasUserInteracted = true;
      scheduleAutoSave();
    };

    const handleEditorKeydown = (event: KeyboardEvent) => {
      if (!isEditorInteractionTarget(event.target)) {
        return;
      }

      const isContentMutationKey =
        event.key === "Enter" ||
        event.key === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Tab";
      const isCommandMutationKey = event.ctrlKey || event.metaKey;

      if (!isContentMutationKey && !isCommandMutationKey) {
        return;
      }

      hasUserInteracted = true;
      scheduleAutoSave();
    };

    const observer = new MutationObserver((mutations) => {
      if (!hasUserInteracted) {
        return;
      }

      const hasEditorMutation = mutations.some((mutation) => {
        const target = mutation.target;
        const element = target instanceof HTMLElement ? target : target.parentElement;
        return element?.closest(".luthor-editor") !== null;
      });

      if (hasEditorMutation) {
        scheduleAutoSave();
      }
    });

    observer.observe(host, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    host.addEventListener("input", handleEditorActivity, true);
    host.addEventListener("beforeinput", handleEditorActivity, true);
    host.addEventListener("change", handleEditorActivity, true);
    host.addEventListener("paste", handleEditorActivity, true);
    host.addEventListener("cut", handleEditorActivity, true);
    host.addEventListener("drop", handleEditorActivity, true);
    host.addEventListener("click", handleEditorActivity, true);
    host.addEventListener("keydown", handleEditorKeydown, true);

    return () => {
      observer.disconnect();
      host.removeEventListener("input", handleEditorActivity, true);
      host.removeEventListener("beforeinput", handleEditorActivity, true);
      host.removeEventListener("change", handleEditorActivity, true);
      host.removeEventListener("paste", handleEditorActivity, true);
      host.removeEventListener("cut", handleEditorActivity, true);
      host.removeEventListener("drop", handleEditorActivity, true);
      host.removeEventListener("click", handleEditorActivity, true);
      host.removeEventListener("keydown", handleEditorKeydown, true);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [preset]);

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
            <div className="demo-editor-host" ref={demoEditorHostRef}>
              {presetNode}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
