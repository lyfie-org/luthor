import { useRef, useState } from "react";
import { jsonbToMarkdown, markdownToJSONB } from "@lyfie/luthor-headless";
import { formatMarkdownSource } from "../../core/source-format";
import { ExtensiveEditor, type ExtensiveEditorProps, type ExtensiveEditorRef } from "../extensive";
import { createModeCache, invalidateModeCache, isModeCached, markModeCached } from "../_shared";

export type MDTextEditorMode = "visual" | "markdown";

export type MDTextEditorProps = Omit<ExtensiveEditorProps, "availableModes" | "initialMode"> & {
  initialMode?: MDTextEditorMode;
};

export function MDTextEditor({ className, variantClassName, initialMode = "visual", ...props }: MDTextEditorProps) {
  const editorRef = useRef<ExtensiveEditorRef | null>(null);
  const modeCacheRef = useRef(createModeCache<MDTextEditorMode>(["visual"]));
  const markdownCacheRef = useRef("");
  const pendingVisualJSONRef = useRef<string | null>(null);
  const [mode, setMode] = useState<MDTextEditorMode>(initialMode);
  const [markdown, setMarkdown] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);

  const handleModeChange = (nextMode: MDTextEditorMode) => {
    if (nextMode === mode) {
      return;
    }

    try {
      setSourceError(null);

      if (nextMode === "markdown") {
        if (!isModeCached(modeCacheRef.current, "markdown")) {
          const jsonb = editorRef.current?.getJSONB() ?? "";
          const parsed = jsonb ? JSON.parse(jsonb) : undefined;
          const nextMarkdown = formatMarkdownSource(jsonbToMarkdown(parsed));
          markdownCacheRef.current = nextMarkdown;
          setMarkdown(nextMarkdown);
          markModeCached(modeCacheRef.current, "markdown");
        } else {
          setMarkdown(markdownCacheRef.current);
        }
      }

      if (nextMode === "visual") {
        const parsed = markdownToJSONB(markdown);
        pendingVisualJSONRef.current = JSON.stringify(parsed);
      }

      setMode(nextMode);

      if (nextMode === "visual") {
        setTimeout(() => {
          if (!pendingVisualJSONRef.current) {
            return;
          }

          editorRef.current?.injectJSONB(pendingVisualJSONRef.current);
          pendingVisualJSONRef.current = null;
        }, 0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse markdown";
      setSourceError(message);
    }
  };

  return (
    <div
      className={["luthor-preset-md-text", className].filter(Boolean).join(" ")}
      onInputCapture={() => {
        if (mode === "visual") {
          invalidateModeCache(modeCacheRef.current, ["visual"]);
        }
      }}
    >
      <div className="luthor-md-text-tabs">
        <button type="button" className={mode === "visual" ? "active" : ""} onClick={() => handleModeChange("visual")}>
          Visual
        </button>
        <button type="button" className={mode === "markdown" ? "active" : ""} onClick={() => handleModeChange("markdown")}>
          Markdown
        </button>
      </div>
      {mode === "visual" && (
        <ExtensiveEditor
          ref={editorRef}
          {...props}
          className="luthor-preset-md-text__editor"
          variantClassName={["luthor-preset-md-text__variant", variantClassName].filter(Boolean).join(" ")}
          availableModes={["visual"]}
          initialMode="visual"
          featureFlags={{
            table: false,
            image: false,
            iframeEmbed: false,
            youTubeEmbed: false,
            customNode: false,
          }}
        />
      )}
      {mode === "markdown" && (
        <div className="luthor-md-text-source-shell">
          <textarea
            className="luthor-md-text-source"
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              markdownCacheRef.current = event.target.value;
              markModeCached(modeCacheRef.current, "markdown");
            }}
            placeholder="Write markdown..."
          />
          {sourceError && <p className="luthor-md-text-error">{sourceError}</p>}
        </div>
      )}
    </div>
  );
}
