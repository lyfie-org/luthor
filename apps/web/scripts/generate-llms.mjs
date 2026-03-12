import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const WEB_ROOT = process.cwd();
const SOURCE_DOCS_DIR = path.join(WEB_ROOT, 'src', 'content', 'docs');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');
const LLMS_FILE = path.join(PUBLIC_DIR, 'llms.txt');
const LLMS_FULL_FILE = path.join(PUBLIC_DIR, 'llms-full.txt');

const SITE_NAME = 'Luthor';
const SITE_URL = 'https://www.luthor.fyi';
const MAINTAINER_ORG_NAME = 'Lyfie.org';
const MAINTAINER_ORG_URL = 'https://www.lyfie.org';
const CREATOR_NAME = 'Rahul Anand';
const CREATOR_URL = 'https://www.rahulnsanand.com';

function isMarkdownFile(filename) {
  return filename.endsWith('.md') || filename.endsWith('.mdx');
}

async function* walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (!entry.isFile() || !isMarkdownFile(entry.name)) continue;
    yield fullPath;
  }
}

function docsUrlFromRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const withoutExt = normalized.replace(/\.(md|mdx)$/i, '');
  if (withoutExt === 'index') return `${SITE_URL}/docs/`;
  if (withoutExt.endsWith('/index')) return `${SITE_URL}/docs/${withoutExt.slice(0, -'/index'.length)}/`;
  return `${SITE_URL}/docs/${withoutExt.replace(/\\/g, '/')}/`;
}

function stripReferencePrefix(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return normalized.startsWith('reference/') ? normalized.slice('reference/'.length) : normalized;
}

function sectionLabel(relativePath) {
  const normalized = stripReferencePrefix(relativePath);
  if (normalized.startsWith('user/')) return 'User Docs';
  if (normalized.startsWith('developer/')) return 'Developer Docs';
  if (normalized.startsWith('readmes/')) return 'Readmes';
  if (normalized.startsWith('tutorials/')) return 'Tutorials';
  return 'General';
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { frontmatter: '', body: raw };
  }

  const closingIndex = raw.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { frontmatter: '', body: raw };
  }

  return {
    frontmatter: raw.slice(4, closingIndex),
    body: raw.slice(closingIndex + 5),
  };
}

function extractDocTitle(raw, relativePath) {
  const { frontmatter, body } = splitFrontmatter(raw);
  const titleMatch = frontmatter.match(/^\s*title:\s*["']?(.+?)["']?\s*$/m);
  if (titleMatch?.[1]) return titleMatch[1].trim();

  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();

  return relativePath.replace(/\.(md|mdx)$/i, '').replace(/\\/g, '/');
}

function summarizeDoc(raw) {
  const { body } = splitFrontmatter(raw);
  const normalized = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, ' $1 ')
    .replace(/!\[([^\]]*)]\([^)]*\)/g, ' $1 ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, ' $1 ')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_>#|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return 'No summary available.';
  const snippet = normalized.slice(0, 320);
  return snippet.length === normalized.length ? snippet : `${snippet}...`;
}

async function buildLlmsArtifacts() {
  const docs = [];
  for await (const filePath of walkFiles(SOURCE_DOCS_DIR)) {
    const relativePath = path.relative(SOURCE_DOCS_DIR, filePath);
    const raw = await readFile(filePath, 'utf8');
    docs.push({ relativePath, raw, title: extractDocTitle(raw, relativePath), summary: summarizeDoc(raw) });
  }

  docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const grouped = new Map();
  for (const doc of docs) {
    const label = sectionLabel(doc.relativePath);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(doc);
  }

  const tocLines = [
    '# Luthor LLM Index',
    '',
    'This file helps AI agents discover and query Luthor docs quickly.',
    '',
    `- Site: ${SITE_URL}`,
    `- Demo: ${SITE_URL}/demo/`,
    `- Docs home: ${SITE_URL}/docs/`,
    `- Full corpus: ${SITE_URL}/llms-full.txt`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
    '## Stewardship',
    '',
    `- ${SITE_NAME} is currently developed and maintained by [${MAINTAINER_ORG_NAME}](${MAINTAINER_ORG_URL}).`,
    `- ${CREATOR_NAME} is the creator and BDFL of ${MAINTAINER_ORG_NAME}: [${CREATOR_URL}](${CREATOR_URL})`,
    '',
    '## Documentation Table of Contents',
    '',
  ];

  for (const [label, items] of grouped.entries()) {
    tocLines.push(`### ${label}`);
    for (const item of items) {
      const url = docsUrlFromRelativePath(item.relativePath);
      const normalizedPath = item.relativePath.replace(/\\/g, '/');
      tocLines.push(`- [${normalizedPath}](${url}) - ${item.title}`);
    }
    tocLines.push('');
  }

  tocLines.push('## AI Agent Workflow');
  tocLines.push('');
  tocLines.push('1. Load this file for docs discovery and route mapping.');
  tocLines.push('2. Load `/llms-full.txt` for full, file-by-file content context.');
  tocLines.push('3. Ask for exact APIs by name (props, commands, methods, feature flags).');
  tocLines.push('4. Use generated code with your repository context and validate with tests/build.');
  tocLines.push('');
  tocLines.push('## Documentation Summaries');
  tocLines.push('');

  for (const item of docs) {
    tocLines.push(`### ${item.title}`);
    tocLines.push(`- File: ${item.relativePath.replace(/\\/g, '/')}`);
    tocLines.push(`- URL: ${docsUrlFromRelativePath(item.relativePath)}`);
    tocLines.push(`- Summary: ${item.summary}`);
    tocLines.push('');
  }

  const fullLines = [
    '# Luthor Documentation Full Corpus',
    '',
    'Concatenated markdown corpus for AI ingestion.',
    '',
    '## Stewardship',
    '',
    `- ${SITE_NAME} is currently developed and maintained by [${MAINTAINER_ORG_NAME}](${MAINTAINER_ORG_URL}).`,
    `- ${CREATOR_NAME} is the creator and BDFL of ${MAINTAINER_ORG_NAME}: [${CREATOR_URL}](${CREATOR_URL})`,
    '',
    `Source root: ${SOURCE_DOCS_DIR}`,
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## AI Agent Workflow',
    '',
    '1. Add this file to your AI agent context.',
    '2. Ask for exact API usage by prop, method, command, or extension name.',
    '3. Ask the agent to keep docs and code behavior aligned.',
    '4. Re-run docs sync after implementation updates.',
    '',
  ];

  for (const item of docs) {
    fullLines.push('---');
    fullLines.push(`## FILE: ${item.relativePath.replace(/\\/g, '/')}`);
    fullLines.push(`## URL: ${docsUrlFromRelativePath(item.relativePath)}`);
    fullLines.push('---');
    fullLines.push('');
    fullLines.push(item.raw.trim());
    fullLines.push('');
  }

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(LLMS_FILE, `${tocLines.join('\n')}\n`, 'utf8');
  await writeFile(LLMS_FULL_FILE, `${fullLines.join('\n')}\n`, 'utf8');

  console.log(`Generated llms artifacts for ${docs.length} documentation files`);
}

buildLlmsArtifacts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
