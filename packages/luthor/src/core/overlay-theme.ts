import type { CSSProperties } from "react";

const FALLBACK_THEME_VARS: Record<string, string> = {
  "--luthor-bg": "#ffffff",
  "--luthor-fg": "#0f172a",
  "--luthor-border": "#e2e8f0",
  "--luthor-border-hover": "#cbd5e1",
  "--luthor-border-active": "#94a3b8",
  "--luthor-accent": "#0f172a",
  "--luthor-accent-hover": "#1e293b",
  "--luthor-shadow": "rgba(0, 0, 0, 0.08)",
  "--luthor-muted": "#f8fafc",
  "--luthor-muted-fg": "#64748b",
  "--luthor-theme-transition": "0.2s ease",
  "--luthor-drag-gutter-width": "56px",
  "--luthor-line-height-ratio": "1",
  "--luthor-toolbar-bg": "#f8fafc",
  "--luthor-toolbar-section-border": "#e2e8f0",
  "--luthor-toolbar-button-fg": "#0f172a",
  "--luthor-toolbar-button-hover-bg": "#f8fafc",
  "--luthor-toolbar-button-hover-border": "#cbd5e1",
  "--luthor-toolbar-button-hover-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
  "--luthor-toolbar-button-press-shadow": "0 2px 8px rgba(0, 0, 0, 0.1)",
  "--luthor-toolbar-button-active-bg": "#0f172a",
  "--luthor-toolbar-button-active-border": "#0f172a",
  "--luthor-toolbar-button-active-fg": "#ffffff",
  "--luthor-toolbar-button-active-shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
  "--luthor-toolbar-button-overlay": "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
  "--luthor-toolbar-button-active-overlay": "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)",
  "--luthor-toolbar-color-indicator-border": "#e2e8f0",
  "--luthor-toolbar-highlight-bg": "#f8fafc",
  "--luthor-quote-bg": "#f8fafc",
  "--luthor-quote-fg": "#0f172a",
  "--luthor-quote-border": "#0f172a",
  "--luthor-syntax-comment": "#64748b",
  "--luthor-syntax-keyword": "#64748b",
  "--luthor-syntax-string": "#64748b",
  "--luthor-syntax-number": "#64748b",
  "--luthor-syntax-function": "#64748b",
  "--luthor-syntax-variable": "#64748b",
  "--luthor-floating-bg": "#ffffff",
  "--luthor-floating-fg": "#0f172a",
  "--luthor-floating-border": "#e2e8f0",
  "--luthor-floating-shadow": "rgba(0, 0, 0, 0.08)",
  "--luthor-floating-muted": "#f8fafc",
  "--luthor-floating-border-hover": "#cbd5e1",
  "--luthor-floating-border-active": "#94a3b8",
  "--luthor-floating-accent": "#0f172a",
  "--luthor-floating-accent-fg": "#ffffff",
  "--luthor-z-dropdown": "20",
  "--luthor-z-popover": "24",
  "--luthor-z-menu": "28",
  "--luthor-z-overlay": "32",
  "--luthor-z-modal": "36",
  "--luthor-preset-bg": "#ffffff",
  "--luthor-preset-fg": "#0f172a",
  "--luthor-preset-border": "#dbe2ea",
  "--luthor-preset-muted": "#f8fafc",
  "--luthor-preset-muted-fg": "#64748b",
  "--luthor-preset-accent": "#2563eb",
  "--luthor-preset-radius": "10px",
  "--luthor-preset-shadow": "0 1px 3px rgba(15, 23, 42, 0.08)",
  "--luthor-preset-content-padding": "16px",
  "--luthor-preset-content-min-height": "180px",
};

function getEditorWrapper(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  return element.closest(".luthor-editor-wrapper") as HTMLElement | null;
}

function resolveThemeSource(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  return getEditorWrapper(element) ?? element;
}

function readThemeVars(source: HTMLElement | null): CSSProperties {
  if (typeof window === "undefined" || !source) {
    return {};
  }

  const computed = window.getComputedStyle(source);
  const style: CSSProperties = {};

  for (const [name, fallback] of Object.entries(FALLBACK_THEME_VARS)) {
    const value = computed.getPropertyValue(name).trim() || fallback;
    (style as Record<string, string>)[name] = value;
  }

  return style;
}

export function getOverlayThemeStyleFromElement(element: HTMLElement | null): CSSProperties {
  return readThemeVars(resolveThemeSource(element));
}

export function getOverlayThemeStyleFromSelection(): CSSProperties {
  if (typeof window === "undefined") {
    return {};
  }

  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode;
  if (!anchorNode) {
    return {};
  }

  const anchorElement =
    anchorNode.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as HTMLElement)
      : anchorNode.parentElement;

  return getOverlayThemeStyleFromElement(anchorElement);
}
