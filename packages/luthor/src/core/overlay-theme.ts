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

