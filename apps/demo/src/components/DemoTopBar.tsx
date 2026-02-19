type DemoPresetId = "chat" | "email" | "markdownVisual" | "htmlVisual" | "themed" | "notion" | "extensive";

interface DemoTopBarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLoadDemoContent: () => void;
  selectedPreset: DemoPresetId;
  selectedPresetLabel: string;
  presetOptions: { id: DemoPresetId; label: string }[];
  onPresetChange: (presetId: DemoPresetId) => void;
}

export function DemoTopBar({
  theme,
  onToggleTheme,
  onLoadDemoContent,
  selectedPreset,
  selectedPresetLabel,
  presetOptions,
  onPresetChange,
}: DemoTopBarProps) {
  return (
    <header className="demo-topbar">
      <div className="demo-brand">
        <span className="demo-brand__dot" aria-hidden="true" />
        <div>
          <p className="demo-brand__kicker">Luthor Showcase</p>
          <strong>{selectedPresetLabel} Editor</strong>
        </div>
      </div>

      <div className="demo-topbar__actions">
        <label className="demo-select-wrap" htmlFor="preset-select">
          <span className="demo-select-label">Preset</span>
          <select
            id="preset-select"
            className="demo-select"
            value={selectedPreset}
            onChange={(event) => onPresetChange(event.target.value as DemoPresetId)}
          >
            {presetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="demo-button demo-button--ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "Switch to light" : "Switch to dark"}
        </button>
        <button type="button" className="demo-button" onClick={onLoadDemoContent}>
          Load Demo Content
        </button>
      </div>
    </header>
  );
}
