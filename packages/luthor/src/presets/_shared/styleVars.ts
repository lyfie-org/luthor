/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { DefaultSettings, StyleVarRecord, StyleVarValueRecord } from "./types";

export function normalizeStyleVarsKey(styleVars?: StyleVarValueRecord): string {
  if (!styleVars) {
    return "__default__";
  }

  const entries = Object.entries(styleVars)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  return entries.length > 0 ? JSON.stringify(entries) : "__default__";
}

export function createDefaultSettingsStyleVarRecord(
  defaultSettings?: DefaultSettings,
): StyleVarRecord | undefined {
  if (!defaultSettings) {
    return undefined;
  }

  const styleVars: StyleVarRecord = {};
  const assign = (token: string, value: string | undefined) => {
    if (typeof value === "string" && value.trim().length > 0) {
      styleVars[token] = value.trim();
    }
  };

  assign("--luthor-fg", defaultSettings.font?.color);
  assign("--luthor-text-bold-color", defaultSettings.font?.boldColor);
  assign("--luthor-link-color", defaultSettings.link?.color);
  assign("--luthor-list-marker-color", defaultSettings.list?.markerColor);
  assign("--luthor-list-checkbox-color", defaultSettings.list?.checkboxColor);
  assign("--luthor-quote-bg", defaultSettings.quote?.backgroundColor);
  assign("--luthor-quote-fg", defaultSettings.quote?.color);
  assign("--luthor-quote-border", defaultSettings.quote?.indicatorColor);
  assign("--luthor-table-border-color", defaultSettings.table?.borderColor);
  assign("--luthor-table-header-bg", defaultSettings.table?.headerBackgroundColor);
  assign("--luthor-hr-color", defaultSettings.hr?.color);
  assign("--luthor-placeholder-color", defaultSettings.placeholder?.color);
  assign("--luthor-codeblock-bg", defaultSettings.codeblock?.backgroundColor);
  assign("--luthor-toolbar-bg", defaultSettings.toolbar?.backgroundColor);

  return Object.keys(styleVars).length > 0 ? styleVars : undefined;
}
