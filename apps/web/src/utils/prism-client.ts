"use client";

import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-json5";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-ini";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-go";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";

type Theme = "light" | "dark";

const PRISM_THEME_LINK_ID = "luthor-prism-theme";

const PRISM_LANGUAGE_ALIASES: Record<string, string> = {
  bash: "bash",
  shell: "bash",
  sh: "bash",
  css: "css",
  html: "markup",
  xml: "markup",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  json5: "json5",
  markdown: "markdown",
  md: "markdown",
  typescript: "typescript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  yml: "yaml",
  yaml: "yaml",
  dockerfile: "docker",
  csharp: "csharp",
  "c#": "csharp",
  go: "go",
  graphql: "graphql",
  ini: "ini",
  toml: "toml",
  kotlin: "kotlin",
  php: "php",
  ruby: "ruby",
};

const prismScope = globalThis as typeof globalThis & { Prism?: typeof Prism };
if (prismScope.Prism !== Prism) {
  prismScope.Prism = Prism;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolvePrismLanguage(language: string | undefined): string | null {
  if (!language) {
    return null;
  }

  const normalized = language.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return PRISM_LANGUAGE_ALIASES[normalized] ?? normalized;
}

export function highlightWithPrism(
  code: string,
  language: string | undefined,
): { html: string; className: string } {
  const resolvedLanguage = resolvePrismLanguage(language);
  if (!resolvedLanguage) {
    return { html: escapeHtml(code), className: "language-plain" };
  }

  const grammar = Prism.languages[resolvedLanguage];
  if (!grammar) {
    return { html: escapeHtml(code), className: `language-${resolvedLanguage}` };
  }

  return {
    html: Prism.highlight(code, grammar, resolvedLanguage),
    className: `language-${resolvedLanguage}`,
  };
}

export function syncPrismTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }

  const href = theme === "dark" ? "/prismjs/themes/prism-okaidia.css" : "/prismjs/themes/prism.css";
  const existing = document.getElementById(PRISM_THEME_LINK_ID);
  const link = existing instanceof HTMLLinkElement ? existing : document.createElement("link");

  if (!(existing instanceof HTMLLinkElement)) {
    link.id = PRISM_THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}
