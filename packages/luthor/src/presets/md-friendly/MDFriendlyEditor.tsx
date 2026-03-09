import { useRef, useState } from "react";
import { jsonToMarkdown, markdownToJSON } from "@lyfie/luthor-headless";
import { formatMarkdownSource } from "../../core/source-format";
import { ExtensiveEditor, type ExtensiveEditorProps, type ExtensiveEditorRef } from "../extensive";
import { createModeCache, invalidateModeCache, isModeCached, markModeCached } from "../_shared";

export type MDFriendlyEditorMode = "visual" | "markdown";

export type MDFriendlyEditorProps = Omit<ExtensiveEditorProps, "availableModes" | "initialMode"> & {
  initialMode?: MDFriendlyEditorMode;
};

export function MDFriendlyEditor({ className, variantClassName, initialMode = "visual", ...props }: MDFriendlyEditorProps) {
  const editorRef = useRef<ExtensiveEditorRef | null>(null);
  const modeCacheRef = useRef(createModeCache<MDFriendlyEditorMode>(["visual"]));
  const markdownCacheRef = useRef("");
  const pendingVisualJSONRef = useRef<string | null>(null);
  const [mode, setMode] = useState<MDFriendlyEditorMode>(initialMode);
  const [markdown, setMarkdown] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);

  const handleModeChange = (nextMode: MDFriendlyEditorMode) => {
    if (nextMode === mode) {
      return;
    }

    try {
      setSourceError(null);

      if (nextMode === "markdown") {
        if (!isModeCached(modeCacheRef.current, "markdown")) {
          const json = editorRef.current?.getJSON() ?? "";
          const parsed = json ? JSON.parse(json) : undefined;
          const nextMarkdown = formatMarkdownSource(jsonToMarkdown(parsed));
          markdownCacheRef.current = nextMarkdown;
          setMarkdown(nextMarkdown);
          markModeCached(modeCacheRef.current, "markdown");
        } else {
          setMarkdown(markdownCacheRef.current);
        }
      }

      if (nextMode === "visual") {
        const parsed = markdownToJSON(markdown);
        pendingVisualJSONRef.current = JSON.stringify(parsed);
      }

      setMode(nextMode);

      if (nextMode === "visual") {
        setTimeout(() => {
          if (!pendingVisualJSONRef.current) {
            return;
          }

          editorRef.current?.injectJSON(pendingVisualJSONRef.current);
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
      className={["luthor-preset-md-friendly", className].filter(Boolean).join(" ")}
      onInputCapture={() => {
        if (mode === "visual") {
          invalidateModeCache(modeCacheRef.current, ["visual"]);
        }
      }}
    >
      <div className="luthor-md-friendly-tabs">
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
          className="luthor-preset-md-friendly__editor"
          variantClassName={["luthor-preset-md-friendly__variant", variantClassName].filter(Boolean).join(" ")}
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
        <div className="luthor-md-friendly-source-shell">
          <textarea
            className="luthor-md-friendly-source"
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              markdownCacheRef.current = event.target.value;
              markModeCached(modeCacheRef.current, "markdown");
            }}
            placeholder="Write markdown..."
          />
          {sourceError && <p className="luthor-md-friendly-error">{sourceError}</p>}
        </div>
      )}
    </div>
  );
}

