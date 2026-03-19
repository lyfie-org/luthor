export type EditorTheme = "light" | "dark";
export type HighlightThemeSource = "public" | "cdn";

type HighlightThemePaths = {
  light: string;
  dark: string;
};

export type HighlightThemeConfig = {
  source?: HighlightThemeSource;
  linkId?: string;
  publicPaths?: HighlightThemePaths;
  cdnPaths?: HighlightThemePaths;
};

const DEFAULT_LINK_ID = "luthor-highlightjs-theme";
const DEFAULT_PUBLIC_PATHS: HighlightThemePaths = {
  light: "/highlightjs/github.css",
  dark: "/highlightjs/github-dark.css",
};
const DEFAULT_CDN_PATHS: HighlightThemePaths = {
  light: "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css",
  dark: "https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css",
};

export function syncHighlightThemeStylesheet(
  theme: EditorTheme,
  config: HighlightThemeConfig = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const linkId = config.linkId ?? DEFAULT_LINK_ID;
  const source = config.source ?? "public";
  const paths = source === "cdn"
    ? (config.cdnPaths ?? DEFAULT_CDN_PATHS)
    : (config.publicPaths ?? DEFAULT_PUBLIC_PATHS);
  const href = theme === "dark" ? paths.dark : paths.light;

  const existing = document.getElementById(linkId);
  const link = existing instanceof HTMLLinkElement
    ? existing
    : document.createElement("link");

  if (!(existing instanceof HTMLLinkElement)) {
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}
