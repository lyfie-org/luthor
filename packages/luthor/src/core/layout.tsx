import { useLayoutEffect, useRef } from "react";
import type { CoreEditorMode } from "./types";

export function ModeTabs({
  mode,
  onModeChange,
  labels,
  availableModes,
  isConverting,
}: {
  mode: CoreEditorMode;
  onModeChange: (mode: CoreEditorMode) => void;
  labels?: Partial<Record<CoreEditorMode, string>>;
  availableModes?: readonly CoreEditorMode[];
  isConverting?: CoreEditorMode | null;
}) {
  const modes = availableModes ?? ["visual", "json"];
  const tabLabels: Record<CoreEditorMode, string> = {
    visual: labels?.visual ?? "Visual",
    json: labels?.json ?? "JSON",
  };

  return (
    <div className="luthor-mode-tabs">
      {modes.includes("visual") && (
        <button className={`luthor-mode-tab ${mode === "visual" ? "active" : ""}`} onClick={() => onModeChange("visual")}>
          {tabLabels.visual}
          {isConverting === "visual" && <span className="luthor-tab-converting-spinner" />}
        </button>
      )}
      {modes.includes("json") && (
        <button className={`luthor-mode-tab ${mode === "json" ? "active" : ""}`} onClick={() => onModeChange("json")}>
          {tabLabels.json}
          {isConverting === "json" && <span className="luthor-tab-converting-spinner" />}
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
