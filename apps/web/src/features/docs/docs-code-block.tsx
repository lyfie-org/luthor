'use client';

import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

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

let languagesRegistered = false;

function registerHighlightLanguages() {
  if (languagesRegistered) return;
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('shell', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('js', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('ts', typescript);
  hljs.registerLanguage('tsx', typescript);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('html', xml);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('md', markdown);
  hljs.registerLanguage('markdown', markdown);
  languagesRegistered = true;
}

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

export function DocsCodeBlock({ code, language }: DocsCodeBlockProps) {
  const [activePm, setActivePm] = useState<PackageManager>('npm');
  const [copyLabel, setCopyLabel] = useState('Copy');
  const pmVariants = useMemo(() => toPmVariants(code), [code]);
  const displayCode = pmVariants ? pmVariants[activePm] : code;
  const highlighted = useMemo(() => {
    registerHighlightLanguages();
    if (language && hljs.getLanguage(language)) {
      const result = hljs.highlight(displayCode, { language, ignoreIllegals: true });
      return { html: result.value, className: `hljs language-${result.language ?? language}` };
    }
    const result = hljs.highlightAuto(displayCode);
    const className = result.language ? `hljs language-${result.language}` : 'hljs';
    return { html: result.value, className };
  }, [displayCode, language]);

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
