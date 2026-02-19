import { useLayoutEffect, useRef } from "react";
import type { CoreEditorMode } from "./types";

export function ModeTabs({
  mode,
  onModeChange,
  labels,
  availableModes,
}: {
  mode: CoreEditorMode;
  onModeChange: (mode: CoreEditorMode) => void;
  labels?: Partial<Record<CoreEditorMode, string>>;
  availableModes?: readonly CoreEditorMode[];
}) {
  const modes = availableModes ?? ["visual", "html", "markdown", "jsonb"];
  const tabLabels: Record<CoreEditorMode, string> = {
    visual: labels?.visual ?? "Visual",
    html: labels?.html ?? "HTML",
    markdown: labels?.markdown ?? "Markdown",
    jsonb: labels?.jsonb ?? "JSONB",
  };

  return (
    <div className="luthor-mode-tabs">
      {modes.includes("visual") && (
        <button className={`luthor-mode-tab ${mode === "visual" ? "active" : ""}`} onClick={() => onModeChange("visual")}>
          {tabLabels.visual}
        </button>
      )}
      {modes.includes("html") && (
        <button className={`luthor-mode-tab ${mode === "html" ? "active" : ""}`} onClick={() => onModeChange("html")}>
          {tabLabels.html}
        </button>
      )}
      {modes.includes("markdown") && (
        <button className={`luthor-mode-tab ${mode === "markdown" ? "active" : ""}`} onClick={() => onModeChange("markdown")}>
          {tabLabels.markdown}
        </button>
      )}
      {modes.includes("jsonb") && (
        <button className={`luthor-mode-tab ${mode === "jsonb" ? "active" : ""}`} onClick={() => onModeChange("jsonb")}>
          {tabLabels.jsonb}
        </button>
      )}
    </div>
  );
}

export function SourceView({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const sourceRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = sourceRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.max(textarea.scrollHeight, 280);
    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={sourceRef}
      className={`luthor-source-view${className ? ` ${className}` : ""}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}