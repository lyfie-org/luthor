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
const MAINTAINER_ORG_URL = 'https://lyfie.org';
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

async function buildLlmsArtifacts() {
  const docs = [];
  for await (const filePath of walkFiles(SOURCE_DOCS_DIR)) {
    const relativePath = path.relative(SOURCE_DOCS_DIR, filePath);
    const raw = await readFile(filePath, 'utf8');
    docs.push({ relativePath, raw });
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
    'This file helps AI agents discover Luthor docs quickly.',
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
      tocLines.push(`- [${normalizedPath}](${url})`);
    }
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
