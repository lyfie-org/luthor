'use client';

import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-jsx.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-tsx.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-powershell.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-swift.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-json5.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-toml.js';
import 'prismjs/components/prism-ini.js';
import 'prismjs/components/prism-docker.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-graphql.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-kotlin.js';
import 'prismjs/components/prism-php.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-xml-doc.js';

const LANGUAGE_ALIASES: Record<string, string> = {
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  json5: 'json5',
  markdown: 'markdown',
  md: 'markdown',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
  yml: 'yaml',
  yaml: 'yaml',
  dockerfile: 'docker',
  csharp: 'csharp',
  'c#': 'csharp',
  go: 'go',
  graphql: 'graphql',
  ini: 'ini',
  toml: 'toml',
  kotlin: 'kotlin',
  php: 'php',
  ruby: 'ruby',
  py: 'python',
  ps1: 'powershell',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolvePrismLanguage(language: string | undefined): string | null {
  if (!language) {
    return null;
  }

  const normalized = language.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export function highlightWithPrism(
  code: string,
  language: string | undefined,
): { html: string; className: string } {
  const resolvedLanguage = resolvePrismLanguage(language);

  if (!resolvedLanguage) {
    return { html: escapeHtml(code), className: 'language-plain' };
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
