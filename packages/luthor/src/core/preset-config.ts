import type { EditorConfig } from "@lyfie/luthor-headless";

export function createPresetEditorConfig(
  presetId: string,
  placeholder: string,
): EditorConfig {
  const presetClass = `luthor-preset-${presetId}`;

  return {
    placeholder,
    classNames: {
      container: `luthor-preset ${presetClass} ${presetClass}__container`,
      contentEditable: `luthor-content-editable ${presetClass}__content`,
      placeholder: `luthor-placeholder ${presetClass}__placeholder`,
    },
  };
}