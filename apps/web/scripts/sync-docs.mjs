import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const WEB_ROOT = process.cwd();
const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');
const SOURCE_DOCS_DIR = path.join(REPO_ROOT, 'documentation');
const TARGET_DOCS_DIR = path.join(WEB_ROOT, 'src', 'content', 'docs', 'reference');
const GENERATED_DOCS_INDEX_FILE = path.join(WEB_ROOT, 'src', 'data', 'docs-index.generated.ts');
const GITHUB_BLOB_BASE = 'https://github.com/lyfie-app/luthor/blob/main';

function isMarkdownFile(filename) {
  return filename.endsWith('.md') || filename.endsWith('.mdx');
}

function toTitleCase(input) {
  return input
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTitle(markdown, filePath) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();

  const filename = path.basename(filePath).replace(/\.(md|mdx)$/i, '');
  return toTitleCase(filename);
}

function ensureTitleFrontmatter(markdown, fallbackTitle) {
  if (markdown.startsWith('---\n')) {
    const closingIndex = markdown.indexOf('\n---\n', 4);
    if (closingIndex !== -1) {
      const frontmatter = markdown.slice(4, closingIndex);
      if (/\btitle\s*:/m.test(frontmatter)) return markdown;

      const nextFrontmatter = `${frontmatter}\ntitle: ${JSON.stringify(fallbackTitle)}`;
      return `---\n${nextFrontmatter}\n---\n${markdown.slice(closingIndex + 5)}`;
    }
  }

  return `---\ntitle: ${JSON.stringify(fallbackTitle)}\n---\n\n${markdown}`;
}

function linkLuthorMentions(markdown) {
  const hasFrontmatter = markdown.startsWith('---\n');
  let frontmatter = '';
  let body = markdown;

  if (hasFrontmatter) {
    const closingIndex = markdown.indexOf('\n---\n', 4);
    if (closingIndex !== -1) {
      frontmatter = markdown.slice(0, closingIndex + 5);
      body = markdown.slice(closingIndex + 5);
    }
  }

  const segments = body.split(/(```[\s\S]*?```)/g);
  const transformedBody = segments
    .map((segment) => {
      if (segment.startsWith('```')) return segment;

      const inlineSplit = segment.split(/(`[^`\n]+`)/g);
      return inlineSplit
        .map((inlineSegment) => {
          if (inlineSegment.startsWith('`') && inlineSegment.endsWith('`')) return inlineSegment;
          return inlineSegment.replace(/(?<!\[)\bLuthor\b(?!\]\()/g, '[Luthor](/demo/)');
        })
        .join('');
    })
    .join('');

  return `${frontmatter}${transformedBody}`;
}

function isExternalUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('mailto:') || value.startsWith('tel:');
}

function splitTargetAndAnchor(target) {
  const [pathname, hash = ''] = target.split('#');
  return { pathname, hash: hash ? `#${hash}` : '' };
}

function toDocsReferenceUrl(relativeDocPath) {
  const normalized = relativeDocPath.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
  if (normalized === 'index') return '/docs/reference/';
  if (normalized.endsWith('/index')) {
    return `/docs/reference/${normalized.slice(0, -'/index'.length)}/`;
  }
  return `/docs/reference/${normalized}/`;
}

function toSlugFromRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const withoutExt = normalized.replace(/\.(md|mdx)$/i, '');

  if (withoutExt === 'index') return [];
  if (withoutExt.endsWith('/index')) {
    return withoutExt
      .slice(0, -'/index'.length)
      .split('/')
      .filter(Boolean);
  }

  return withoutExt.split('/').filter(Boolean);
}

async function resolveMarkdownTargetPath(sourceFile, targetPath) {
  const sourceDir = path.dirname(sourceFile);
  const resolved = path.resolve(sourceDir, targetPath);

  try {
    const fileStats = await stat(resolved);
    if (fileStats.isFile()) return resolved;
  } catch {
    // Continue and try common markdown extensions.
  }

  const withMd = `${resolved}.md`;
  try {
    const mdStats = await stat(withMd);
    if (mdStats.isFile()) return withMd;
  } catch {
    // Ignore.
  }

  const withMdx = `${resolved}.mdx`;
  try {
    const mdxStats = await stat(withMdx);
    if (mdxStats.isFile()) return withMdx;
  } catch {
    // Ignore.
  }

  const docsRelativeGuess = targetPath
    .replace(/\\/g, '/')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\.\//, '');
  if (docsRelativeGuess) {
    const guessedFromDocsRoot = path.resolve(SOURCE_DOCS_DIR, docsRelativeGuess);
    try {
      const guessedStats = await stat(guessedFromDocsRoot);
      if (guessedStats.isFile()) return guessedFromDocsRoot;
    } catch {
      // Continue to extension guesses.
    }

    try {
      const guessedMdStats = await stat(`${guessedFromDocsRoot}.md`);
      if (guessedMdStats.isFile()) return `${guessedFromDocsRoot}.md`;
    } catch {
      // Ignore.
    }

    try {
      const guessedMdxStats = await stat(`${guessedFromDocsRoot}.mdx`);
      if (guessedMdxStats.isFile()) return `${guessedFromDocsRoot}.mdx`;
    } catch {
      // Ignore.
    }
  }

  return null;
}

async function rewriteMarkdownLinks(markdown, sourceFile) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const replacements = [];

  for (const match of markdown.matchAll(linkPattern)) {
    const fullMatch = match[0];
    const label = match[1];
    const rawTarget = match[2].trim();
    if (!rawTarget || rawTarget.startsWith('#') || isExternalUrl(rawTarget)) continue;

    const { pathname, hash } = splitTargetAndAnchor(rawTarget);
    if (!pathname || !/\.(md|mdx)$/i.test(pathname)) continue;

    const resolvedTarget = await resolveMarkdownTargetPath(sourceFile, pathname);
    if (!resolvedTarget) {
      const repoRelativeDocsGuess = pathname
        .replace(/\\/g, '/')
        .replace(/^(\.\.\/)+/, '')
        .replace(/^\.\//, '');
      if (!repoRelativeDocsGuess) continue;
      const githubFallback = `${GITHUB_BLOB_BASE}/documentation/${repoRelativeDocsGuess}${hash}`;
      replacements.push({
        from: fullMatch,
        to: `[${label}](${githubFallback})`,
      });
      continue;
    }

    let nextTarget = null;
    if (resolvedTarget.startsWith(SOURCE_DOCS_DIR)) {
      const relativeDocPath = path.relative(SOURCE_DOCS_DIR, resolvedTarget);
      nextTarget = `${toDocsReferenceUrl(relativeDocPath)}${hash}`;
    } else if (resolvedTarget.startsWith(REPO_ROOT)) {
      const repoRelative = path.relative(REPO_ROOT, resolvedTarget).replace(/\\/g, '/');
      nextTarget = `${GITHUB_BLOB_BASE}/${repoRelative}${hash}`;
    }

    if (!nextTarget) continue;
    replacements.push({
      from: fullMatch,
      to: `[${label}](${nextTarget})`,
    });
  }

  let nextMarkdown = markdown;
  for (const replacement of replacements) {
    nextMarkdown = nextMarkdown.replace(replacement.from, replacement.to);
  }

  return nextMarkdown;
}

async function* walkMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdownFiles(fullPath);
      continue;
    }

    if (!entry.isFile() || !isMarkdownFile(entry.name)) continue;
    yield fullPath;
  }
}

async function syncDocs() {
  const sourceStats = await stat(SOURCE_DOCS_DIR);
  if (!sourceStats.isDirectory()) {
    throw new Error(`Expected directory at ${SOURCE_DOCS_DIR}`);
  }

  await rm(TARGET_DOCS_DIR, { recursive: true, force: true });
  await mkdir(TARGET_DOCS_DIR, { recursive: true });
  await mkdir(path.dirname(GENERATED_DOCS_INDEX_FILE), { recursive: true });

  let copiedFiles = 0;
  const docsIndex = [];
  for await (const sourceFile of walkMarkdownFiles(SOURCE_DOCS_DIR)) {
    const relativePath = path.relative(SOURCE_DOCS_DIR, sourceFile);
    const targetFile = path.join(TARGET_DOCS_DIR, relativePath);
    const targetDir = path.dirname(targetFile);

    await mkdir(targetDir, { recursive: true });

    const markdown = await readFile(sourceFile, 'utf8');
    const title = buildTitle(markdown, sourceFile);
    const withFrontmatter = ensureTitleFrontmatter(markdown, title);
    const withLuthorLinks = linkLuthorMentions(withFrontmatter);
    const nextContent = await rewriteMarkdownLinks(withLuthorLinks, sourceFile);
    await writeFile(targetFile, nextContent, 'utf8');

    const { data, content } = matter(nextContent);
    const sourceStats = await stat(sourceFile);
    const slug = toSlugFromRelativePath(relativePath);
    const resolvedTitle = (typeof data.title === 'string' && data.title.trim()) || title;
    const description =
      (typeof data.description === 'string' && data.description.trim()) ||
      `Reference documentation for ${resolvedTitle}.`;

    docsIndex.push({
      slug,
      title: resolvedTitle,
      description,
      content,
      urlPath: toDocsReferenceUrl(relativePath),
      sourcePath: path.relative(REPO_ROOT, sourceFile).replace(/\\/g, '/'),
      updatedAt: sourceStats.mtime.toISOString(),
    });
    copiedFiles += 1;
  }

  docsIndex.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
  const generatedSource = `export const docsIndex = ${JSON.stringify(docsIndex, null, 2)};\n`;
  await writeFile(GENERATED_DOCS_INDEX_FILE, generatedSource, 'utf8');

  console.log(`Synced ${copiedFiles} documentation files to ${TARGET_DOCS_DIR}`);
}

syncDocs().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
