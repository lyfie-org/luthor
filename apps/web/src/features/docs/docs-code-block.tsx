'use client';

import { useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

type PackageManager = 'npm' | 'yarn' | 'pnpm';

type DocsCodeBlockProps = {
  code: string;
  language?: string;
};

const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'yarn', 'pnpm'];
const SCRIPT_HINTS = new Set(['dev', 'build', 'start', 'test', 'lint', 'preview', 'deploy']);
const RESERVED_PM_COMMANDS = new Set([
  'add',
  'install',
  'i',
  'remove',
  'uninstall',
  'rm',
  'run',
  'create',
  'dlx',
  'exec',
  'init',
  'up',
  'update',
]);

const PRISM_LANGUAGE_ALIASES: Record<string, string> = {
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
};

function replaceSaveDevFlags(args: string, target: PackageManager): string {
  if (target === 'npm') return args;
  return args.replace(/\s--save-dev\b/g, ' -D').replace(/\s--save-prod\b/g, '');
}

function splitIndent(line: string): { indent: string; body: string } {
  const match = line.match(/^(\s*)(.*)$/);
  return {
    indent: match?.[1] ?? '',
    body: match?.[2] ?? '',
  };
}

function isScriptLikeCommand(manager: PackageManager, head: string): boolean {
  if (RESERVED_PM_COMMANDS.has(head)) return false;
  if (manager === 'npm') return false;
  return SCRIPT_HINTS.has(head) || /^[a-z][a-z0-9:-]*$/i.test(head);
}

function translateLine(line: string, target: PackageManager): string {
  const { indent, body } = splitIndent(line);
  if (!body || body.startsWith('#')) return line;

  const parts = body.split(/\s+/);
  const manager = parts[0] as PackageManager | 'npx';
  const command = parts[1] ?? '';
  const rest = parts.slice(2).join(' ');

  if (manager === 'npx') {
    if (target === 'npm') return line;
    if (target === 'yarn') return `${indent}yarn dlx ${parts.slice(1).join(' ')}`.trimEnd();
    return `${indent}pnpm dlx ${parts.slice(1).join(' ')}`.trimEnd();
  }

  if (manager !== 'npm' && manager !== 'yarn' && manager !== 'pnpm') {
    return line;
  }

  const scriptBody = manager === 'npm' && command === 'run' && parts[2]
    ? [parts[2], ...parts.slice(3)].join(' ')
    : isScriptLikeCommand(manager, command)
      ? [command, ...parts.slice(2)].join(' ')
      : '';

  if (scriptBody) {
    if (target === 'npm') return `${indent}npm run ${scriptBody}`.trimEnd();
    return `${indent}${target} ${scriptBody}`.trimEnd();
  }

  if (manager === target) return line;

  if (['add', 'install', 'i'].includes(command)) {
    const args = replaceSaveDevFlags(rest, target);
    if (target === 'npm') return `${indent}npm install ${args}`.trimEnd();
    return `${indent}${target} add ${args}`.trimEnd();
  }

  if (['remove', 'uninstall', 'rm'].includes(command)) {
    if (target === 'npm') return `${indent}npm uninstall ${rest}`.trimEnd();
    return `${indent}${target} remove ${rest}`.trimEnd();
  }

  if (['update', 'up'].includes(command)) {
    if (target === 'npm') return `${indent}npm update ${rest}`.trimEnd();
    return `${indent}${target} up ${rest}`.trimEnd();
  }

  if (command === 'create') {
    return `${indent}${target} create ${rest}`.trimEnd();
  }

  if (command === 'dlx' || command === 'exec') {
    if (target === 'npm') return `${indent}npx ${[...parts.slice(2)].join(' ')}`.trimEnd();
    return `${indent}${target} dlx ${[...parts.slice(2)].join(' ')}`.trimEnd();
  }

  return line;
}

function toPmVariants(code: string): Record<PackageManager, string> | null {
  const lines = code.split('\n');
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (nonEmpty.length === 0) return null;

  const looksLikePmBlock = nonEmpty.every((line) =>
    /^(?:\s*)(?:npm|pnpm|yarn|npx)\b/.test(line.trimStart()),
  );
  if (!looksLikePmBlock) return null;

  return {
    npm: lines.map((line) => translateLine(line, 'npm')).join('\n'),
    yarn: lines.map((line) => translateLine(line, 'yarn')).join('\n'),
    pnpm: lines.map((line) => translateLine(line, 'pnpm')).join('\n'),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolvePrismLanguage(language: string | undefined): string | null {
  if (!language) {
    return null;
  }

  const normalized = language.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return PRISM_LANGUAGE_ALIASES[normalized] ?? normalized;
}

function highlightWithPrism(code: string, language: string | undefined): { html: string; className: string } {
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

function highlightPmCode(code: string): string {
  const verbSet = new Set(['install', 'add', 'remove', 'uninstall', 'update', 'up', 'run', 'dlx', 'exec', 'create']);
  const managerSet = new Set(['npm', 'yarn', 'pnpm', 'npx']);

  return code
    .split('\n')
    .map((line) => {
      const parts = line.split(/(\s+)/);
      let tokenIndex = 0;

      return parts
        .map((part) => {
          if (!part || /^\s+$/.test(part)) return part;
          const safe = escapeHtml(part);
          const currentIndex = tokenIndex;
          tokenIndex += 1;

          if (currentIndex === 0 && managerSet.has(part)) {
            return `<span class="docs-pm-manager">${safe}</span>`;
          }
          if (currentIndex === 1 && verbSet.has(part)) {
            return `<span class="docs-pm-verb">${safe}</span>`;
          }
          if (part.startsWith('-')) {
            return `<span class="docs-pm-flag">${safe}</span>`;
          }
          if (part.startsWith('@') || part.includes('/')) {
            return `<span class="docs-pm-package">${safe}</span>`;
          }
          return safe;
        })
        .join('');
    })
    .join('\n');
}

export function DocsCodeBlock({ code, language }: DocsCodeBlockProps) {
  const [activePm, setActivePm] = useState<PackageManager>('npm');
  const [copyLabel, setCopyLabel] = useState('Copy');
  const pmVariants = useMemo(() => toPmVariants(code), [code]);
  const displayCode = pmVariants ? pmVariants[activePm] : code;
  const effectiveLanguage = pmVariants ? 'bash' : language;
  const highlighted = useMemo(() => {
    if (pmVariants) {
      return { html: highlightPmCode(displayCode), className: 'docs-pm-code language-bash' };
    }

    return highlightWithPrism(displayCode, effectiveLanguage);
  }, [displayCode, effectiveLanguage, pmVariants]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopyLabel('Copied');
    } catch {
      setCopyLabel('Copy failed');
    } finally {
      window.setTimeout(() => setCopyLabel('Copy'), 1500);
    }
  }

  return (
    <div className="docs-code-block">
      <div className="docs-code-toolbar">
        {pmVariants ? (
          <div className="docs-code-tabs" role="tablist" aria-label="Package manager">
            {PACKAGE_MANAGERS.map((pm) => (
              <button
                key={pm}
                type="button"
                role="tab"
                aria-selected={activePm === pm}
                className={`docs-code-tab ${activePm === pm ? 'is-active' : ''}`}
                onClick={() => setActivePm(pm)}
              >
                {pm}
              </button>
            ))}
          </div>
        ) : (
          <span className="docs-code-lang">{language ?? 'code'}</span>
        )}
        <button type="button" className="docs-code-copy" onClick={copyCode}>
          {copyLabel}
        </button>
      </div>
      <pre>
        <code className={highlighted.className} dangerouslySetInnerHTML={{ __html: highlighted.html }} />
      </pre>
    </div>
  );
}
