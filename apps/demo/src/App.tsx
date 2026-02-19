import './App.css'
import {
  ChatEditor,
  EmailEditor,
  ExtensiveEditor,
  HtmlVisualEditor,
  MarkdownVisualEditor,
  NotionEditor,
  ThemedEditor,
  extensiveExtensions,
} from "@lyfie/luthor";
import type { ExtensiveEditorRef } from "@lyfie/luthor";
import React from "react";
import "@lyfie/luthor/styles.css";
import { DemoTopBar } from "./components/DemoTopBar";
import { EditorPlayground } from "./components/EditorPlayground";
import { FeatureCoveragePanel } from "./components/FeatureCoveragePanel";
import { PersistencePanel } from "./components/PersistencePanel";
import { ShowcaseHero } from "./components/ShowcaseHero";
import {
  CATEGORY_BY_EXTENSION,
  CATEGORY_ORDER,
  EXTENSIVE_DEMO_MARKDOWN,
  JOURNAL_SCENARIO_JSONB,
} from "./data/demoContent";

type DemoTheme = "light" | "dark";
type DemoPresetId = "chat" | "email" | "markdownVisual" | "htmlVisual" | "themed" | "notion" | "extensive";

const THEME_STORAGE_KEY = "luthor-demo-theme";

const PRESET_OPTIONS: { id: DemoPresetId; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "email", label: "Email" },
  { id: "extensive", label: "Extensive" },
  { id: "markdownVisual", label: "Markdown / Visual" },
  { id: "htmlVisual", label: "HTML / Visual" },
  { id: "themed", label: "Themed" },
  { id: "notion", label: "Notion" },
];

const PRESET_DEMO_MARKDOWN: Record<DemoPresetId, string> = {
  chat: EXTENSIVE_DEMO_MARKDOWN,
  email: EXTENSIVE_DEMO_MARKDOWN,
  extensive: EXTENSIVE_DEMO_MARKDOWN,
  markdownVisual: EXTENSIVE_DEMO_MARKDOWN,
  htmlVisual: EXTENSIVE_DEMO_MARKDOWN,
  themed: EXTENSIVE_DEMO_MARKDOWN,
  notion: EXTENSIVE_DEMO_MARKDOWN,
};

type PersistedJournalPayload = {
  schemaVersion: 1;
  preset: DemoPresetId;
  theme: DemoTheme;
  savedAt: string;
  extensions: string[];
  content: {
    jsonb: string;
    markdown: string;
  };
};

function getInitialTheme(): DemoTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function titleFromExtensionKey(key: string): string {
  return key
    .replace(/Extension$/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function App() {
  const editorRef = React.useRef<ExtensiveEditorRef>(null);
  const pendingDocumentRef = React.useRef<{
    jsonb: string;
    markdown: string;
  } | null>(null);

  const [theme, setTheme] = React.useState<DemoTheme>(() => getInitialTheme());
  const [selectedPreset, setSelectedPreset] = React.useState<DemoPresetId>("chat");
  const [editorInstanceKey, setEditorInstanceKey] = React.useState(0);
  const [copiedState, setCopiedState] = React.useState<"idle" | "done" | "error">("idle");
  const [payloadEditorValue, setPayloadEditorValue] = React.useState("");
  const [persistenceStatus, setPersistenceStatus] = React.useState(
    "Load the journal scenario, edit it freely, then save to JSONB payload.",
  );

  const extensionNames = React.useMemo(() => {
    const names = extensiveExtensions
      .map((extension) => (extension as { name?: string }).name)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names));
  }, []);

  const groupedFeatures = React.useMemo(() => {
    const groups = new Map<string, string[]>();

    extensionNames.forEach((name) => {
      const category = CATEGORY_BY_EXTENSION[name] ?? "Other";
      const current = groups.get(category) ?? [];
      current.push(name);
      groups.set(category, current);
    });

    return CATEGORY_ORDER
      .map((title) => ({
        title,
        items: (groups.get(title) ?? []).sort((a, b) => a.localeCompare(b)),
      }))
      .filter((group) => group.items.length > 0);
  }, [extensionNames]);

  const totalFeatureGroups = groupedFeatures.length;
  const densestGroup = groupedFeatures.reduce<{ title: string; count: number }>(
    (largest, group) => (group.items.length > largest.count ? { title: group.title, count: group.items.length } : largest),
    { title: "N/A", count: 0 },
  );

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const selectedPresetLabel = React.useMemo(
    () => PRESET_OPTIONS.find((option) => option.id === selectedPreset)?.label ?? "Preset",
    [selectedPreset],
  );

  const handleEditorReady = React.useCallback((methods: ExtensiveEditorRef) => {
    if (pendingDocumentRef.current?.jsonb) {
      methods.injectJSONB(pendingDocumentRef.current.jsonb);
      pendingDocumentRef.current = null;
      return;
    }

    const markdown = PRESET_DEMO_MARKDOWN[selectedPreset] ?? EXTENSIVE_DEMO_MARKDOWN;
    methods.injectMarkdown(markdown);
  }, [selectedPreset]);

  const handleLoadDemoContent = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.injectMarkdown(PRESET_DEMO_MARKDOWN[selectedPreset] ?? EXTENSIVE_DEMO_MARKDOWN);
    setPersistenceStatus("Loaded demo markdown content.");
  }, [selectedPreset]);

  const handleLoadJournalScenario = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.injectJSONB(JSON.stringify(JOURNAL_SCENARIO_JSONB));
    setPersistenceStatus("Loaded journal scenario from JSONB node data with YouTube and iframe components.");
  }, []);

  const handleSavePayload = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      setPersistenceStatus("Editor is not ready yet.");
      return;
    }

    const payload: PersistedJournalPayload = {
      schemaVersion: 1,
      preset: selectedPreset,
      theme,
      savedAt: new Date().toISOString(),
      extensions: extensionNames,
      content: {
        jsonb: editor.getJSONB(),
        markdown: editor.getMarkdown(),
      },
    };

    setPayloadEditorValue(JSON.stringify(payload, null, 2));
    setPersistenceStatus("Saved editor state as JSONB-ready payload.");
  }, [extensionNames, selectedPreset, theme]);

  const handleRestorePayload = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      setPersistenceStatus("Editor is not ready yet.");
      return;
    }

    try {
      const parsed = JSON.parse(payloadEditorValue) as Partial<PersistedJournalPayload>;
      const jsonb = parsed?.content?.jsonb;
      const markdown = parsed?.content?.markdown;

      if (typeof jsonb === "string" && jsonb.trim().length > 0) {
        editor.injectJSONB(jsonb);
        setPersistenceStatus("Restored exact document from payload JSONB node structure.");
        return;
      }

      if (typeof markdown === "string" && markdown.trim().length > 0) {
        editor.injectMarkdown(markdown);
        setPersistenceStatus("Restored from payload markdown fallback.");
        return;
      }

      setPersistenceStatus("Payload is valid JSON but missing content.jsonb/content.markdown.");
    } catch {
      setPersistenceStatus("Payload is not valid JSON.");
    }
  }, [payloadEditorValue]);

  const handleCopyPayload = React.useCallback(async () => {
    if (!payloadEditorValue) {
      setPersistenceStatus("Generate a payload first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(payloadEditorValue);
      setPersistenceStatus("Copied payload to clipboard.");
    } catch {
      setPersistenceStatus("Failed to copy payload.");
    }
  }, [payloadEditorValue]);

  const handlePresetChange = React.useCallback((preset: DemoPresetId) => {
    const editor = editorRef.current;
    if (editor) {
      pendingDocumentRef.current = {
        jsonb: editor.getJSONB(),
        markdown: editor.getMarkdown(),
      };
    }

    setSelectedPreset(preset);
    setEditorInstanceKey((currentKey) => currentKey + 1);
  }, []);

  const handleCopyMarkdown = React.useCallback(async () => {
    try {
      const markdown = editorRef.current?.getMarkdown();
      if (!markdown) {
        setCopiedState("error");
        window.setTimeout(() => setCopiedState("idle"), 1600);
        return;
      }
      await navigator.clipboard.writeText(markdown);
      setCopiedState("done");
    } catch {
      setCopiedState("error");
    }

    window.setTimeout(() => setCopiedState("idle"), 1400);
  }, []);

  const handleThemeToggle = React.useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      pendingDocumentRef.current = {
        jsonb: editor.getJSONB(),
        markdown: editor.getMarkdown(),
      };
    }

    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
    setEditorInstanceKey((currentKey) => currentKey + 1);
  }, []);

  const copyButtonLabel = copiedState === "done" ? "Copied" : copiedState === "error" ? "Copy failed" : "Copy Markdown";

  return (
    <div className="app-shell" data-theme={theme}>
      <main className="demo-page">
        <DemoTopBar
          theme={theme}
          onToggleTheme={handleThemeToggle}
          onLoadDemoContent={handleLoadDemoContent}
          selectedPreset={selectedPreset}
          selectedPresetLabel={selectedPresetLabel}
          presetOptions={PRESET_OPTIONS}
          onPresetChange={handlePresetChange}
        />

        <ShowcaseHero
          extensionCount={extensionNames.length}
          totalFeatureGroups={totalFeatureGroups}
          densestGroupTitle={densestGroup.title}
        />

        <FeatureCoveragePanel
          extensionCount={extensionNames.length}
          totalFeatureGroups={totalFeatureGroups}
          groupedFeatures={groupedFeatures}
          onCopyMarkdown={handleCopyMarkdown}
          copyButtonLabel={copyButtonLabel}
          titleFromExtensionKey={titleFromExtensionKey}
        />

        <PersistencePanel
          payload={payloadEditorValue}
          statusMessage={persistenceStatus}
          onLoadJournalScenario={handleLoadJournalScenario}
          onSavePayload={handleSavePayload}
          onRestorePayload={handleRestorePayload}
          onCopyPayload={handleCopyPayload}
          onPayloadChange={setPayloadEditorValue}
        />

        <EditorPlayground>
          {selectedPreset === "chat" && (
            <ChatEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "email" && (
            <EmailEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "extensive" && (
            <ExtensiveEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "markdownVisual" && (
            <MarkdownVisualEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "htmlVisual" && (
            <HtmlVisualEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "themed" && (
            <ThemedEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
          {selectedPreset === "notion" && (
            <NotionEditor
              key={editorInstanceKey}
              ref={editorRef}
              onReady={handleEditorReady}
              initialTheme={theme}
              showDefaultContent={false}
            />
          )}
        </EditorPlayground>
      </main>
    </div>
  );
}

export default App
