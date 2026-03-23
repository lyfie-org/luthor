import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const WEB_ROOT = process.cwd();
const REPO_ROOT = path.resolve(WEB_ROOT, "..", "..");
const SOURCE_DOCS_DIR = path.join(WEB_ROOT, "src", "content", "docs");
const GENERATED_DOCS_INDEX_FILE = path.join(WEB_ROOT, "src", "data", "docs-index.generated.ts");
const GENERATED_DOCS_API_INDEX_FILE = path.join(WEB_ROOT, "src", "data", "docs-api-index.generated.ts");
const GITHUB_BLOB_BASE = "https://github.com/lyfie-org/luthor/blob/main";

const REQUIRED_FRONTMATTER_FIELDS = [
  "title",
  "description",
  "package",
  "docType",
  "surface",
  "keywords",
  "exports",
  "commands",
  "extensions",
  "nodes",
  "frameworks",
  "lastVerifiedFrom",
];

const VALID_PACKAGE_VALUES = new Set([
  "luthor",
  "headless",
  "shared",
  "integrations",
  "contributor",
]);

const VALID_DOC_TYPE_VALUES = new Set([
  "guide",
  "concept",
  "reference",
  "integration",
  "tutorial",
]);

const VALID_SURFACE_VALUES = new Set([
  "preset",
  "extension",
  "command",
  "prop",
  "bridge",
  "node",
  "tooling",
]);

const VALID_NAV_GROUP_VALUES = new Set([
  "start_here",
  "luthor",
  "luthor_headless",
  "integrations",
  "reference",
  "contributing",
  "other",
]);

function isMarkdownFile(filename) {
  return filename.endsWith(".md") || filename.endsWith(".mdx");
}

function toTitleCase(input) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTitle(markdown, filePath) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();

  const filename = path.basename(filePath).replace(/\.(md|mdx)$/i, "");
  return toTitleCase(filename);
}

function isExternalUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("mailto:") || value.startsWith("tel:");
}

function splitTargetAndAnchor(target) {
  const [pathname, hash = ""] = target.split("#");
  return { pathname, hash: hash ? `#${hash}` : "" };
}

function toDocsReferenceUrl(relativeDocPath) {
  const normalized = relativeDocPath.replace(/\\/g, "/").replace(/\.(md|mdx)$/i, "");
  if (normalized === "index") return "/docs/";
  if (normalized.endsWith("/index")) {
    return `/docs/${normalized.slice(0, -"/index".length)}/`;
  }
  return `/docs/${normalized}/`;
}

function toSlugFromRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const withoutExt = normalized.replace(/\.(md|mdx)$/i, "");

  if (withoutExt === "index") return [];
  if (withoutExt.endsWith("/index")) {
    return withoutExt
      .slice(0, -"/index".length)
      .split("/")
      .filter(Boolean);
  }

  return withoutExt.split("/").filter(Boolean);
}

function linkLuthorMentions(markdown) {
  const hasFrontmatter = markdown.startsWith("---\n");
  let frontmatter = "";
  let body = markdown;

  if (hasFrontmatter) {
    const closingIndex = markdown.indexOf("\n---\n", 4);
    if (closingIndex !== -1) {
      frontmatter = markdown.slice(0, closingIndex + 5);
      body = markdown.slice(closingIndex + 5);
    }
  }

  const segments = body.split(/(```[\s\S]*?```)/g);
  const transformedBody = segments
    .map((segment) => {
      if (segment.startsWith("```")) return segment;

      const inlineSplit = segment.split(/(`[^`\n]+`)/g);
      return inlineSplit
        .map((inlineSegment) => {
          if (inlineSegment.startsWith("`") && inlineSegment.endsWith("`")) return inlineSegment;
          return inlineSegment.replace(/(?<!\[)\bLuthor\b(?!\]\()/g, "[Luthor](/demo/)");
        })
        .join("");
    })
    .join("");

  return `${frontmatter}${transformedBody}`;
}

async function resolveMarkdownTargetPath(sourceFile, targetPath) {
  const sourceDir = path.dirname(sourceFile);
  const resolved = path.resolve(sourceDir, targetPath);

  try {
    const fileStats = await stat(resolved);
    if (fileStats.isFile()) return resolved;
  } catch {
    // Continue with extension checks.
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
    .replace(/\\/g, "/")
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\.\//, "");
  if (!docsRelativeGuess) return null;

  const guessedFromDocsRoot = path.resolve(SOURCE_DOCS_DIR, docsRelativeGuess);
  try {
    const guessedStats = await stat(guessedFromDocsRoot);
    if (guessedStats.isFile()) return guessedFromDocsRoot;
  } catch {
    // Continue with extension checks.
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

  return null;
}

async function rewriteMarkdownLinks(markdown, sourceFile) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const replacements = [];

  for (const match of markdown.matchAll(linkPattern)) {
    const fullMatch = match[0];
    const label = match[1];
    const rawTarget = match[2].trim();
    if (!rawTarget || rawTarget.startsWith("#") || isExternalUrl(rawTarget)) continue;

    const { pathname, hash } = splitTargetAndAnchor(rawTarget);
    if (!pathname || !/\.(md|mdx)$/i.test(pathname)) continue;

    const resolvedTarget = await resolveMarkdownTargetPath(sourceFile, pathname);
    if (!resolvedTarget) {
      const repoRelativeDocsGuess = pathname
        .replace(/\\/g, "/")
        .replace(/^(\.\.\/)+/, "")
        .replace(/^\.\//, "");
      if (!repoRelativeDocsGuess) continue;
      const githubFallback = `${GITHUB_BLOB_BASE}/apps/web/src/content/docs/${repoRelativeDocsGuess}${hash}`;
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
      const repoRelative = path.relative(REPO_ROOT, resolvedTarget).replace(/\\/g, "/");
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

function normalizeToken(value) {
  return value
    .toLowerCase()
    .replace(/[`"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeForSearch(value) {
  const normalized = normalizeToken(value);
  if (!normalized) return [];

  const expanded = normalized
    .replace(/[/.#:_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const variants = new Set([normalized, ...expanded]);
  return [...variants];
}

function normalizeTokenList(values) {
  const tokens = new Set();
  for (const value of values) {
    for (const token of tokenizeForSearch(value)) {
      tokens.add(token);
    }
  }
  return [...tokens].sort((a, b) => a.localeCompare(b));
}

function stripMarkdownToPlainText(markdown) {
  return markdown
    .replace(/```([\w-]+)?\n?/g, " ")
    .replace(/```/g, " ")
    .replace(/`([^`]*)`/g, " $1 ")
    .replace(/!\[([^\]]*)]\([^)]*\)/g, " $1 ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, " $1 ")
    .replace(/<[^>]*>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[#>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeading(heading) {
  const normalized = heading
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || "section";
}

function parseHeadingsAndSections(markdown) {
  const headings = [];
  const sections = [];
  const headingCounts = new Map();

  const lines = markdown.split(/\r?\n/);
  let currentSection = {
    heading: "Overview",
    id: "overview",
    level: 1,
    contentLines: [],
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!headingMatch) {
      currentSection.contentLines.push(line);
      continue;
    }

    const level = headingMatch[1].length;
    const text = headingMatch[2].trim();
    const baseSlug = slugifyHeading(text);
    const nextCount = (headingCounts.get(baseSlug) ?? 0) + 1;
    headingCounts.set(baseSlug, nextCount);
    const id = nextCount > 1 ? `${baseSlug}-${nextCount}` : baseSlug;

    const existingSectionText = stripMarkdownToPlainText(currentSection.contentLines.join("\n"));
    if (existingSectionText) {
      sections.push({
        heading: currentSection.heading,
        id: currentSection.id,
        level: currentSection.level,
        text: existingSectionText,
      });
    }

    headings.push({ level, text, id });
    currentSection = {
      heading: text,
      id,
      level,
      contentLines: [],
    };
  }

  const finalSectionText = stripMarkdownToPlainText(currentSection.contentLines.join("\n"));
  if (finalSectionText) {
    sections.push({
      heading: currentSection.heading,
      id: currentSection.id,
      level: currentSection.level,
      text: finalSectionText,
    });
  }

  return { headings, sections };
}

function assertStringField(fileLabel, data, fieldName, errors, options = {}) {
  const raw = data[fieldName];
  if (typeof raw !== "string" || !raw.trim()) {
    errors.push(`${fileLabel}: missing or invalid "${fieldName}" (expected non-empty string).`);
    return "";
  }

  const value = raw.trim();
  if (options.validValues && !options.validValues.has(value)) {
    errors.push(
      `${fileLabel}: invalid "${fieldName}" value "${value}". Allowed: ${[...options.validValues].join(", ")}.`,
    );
  }
  return value;
}

function assertStringArrayField(fileLabel, data, fieldName, errors) {
  const raw = data[fieldName];
  if (!Array.isArray(raw)) {
    errors.push(`${fileLabel}: missing or invalid "${fieldName}" (expected string[]).`);
    return [];
  }

  const values = [];
  for (const entry of raw) {
    if (typeof entry !== "string" || !entry.trim()) {
      errors.push(`${fileLabel}: field "${fieldName}" contains invalid entry (expected non-empty string).`);
      continue;
    }
    values.push(entry.trim());
  }
  return values;
}

function inferNavGroup(relativePath, packageName, explicitNavGroup) {
  if (typeof explicitNavGroup === "string" && VALID_NAV_GROUP_VALUES.has(explicitNavGroup)) {
    return explicitNavGroup;
  }

  const normalized = relativePath.replace(/\\/g, "/");
  if (packageName === "contributor" || normalized.startsWith("getting-started/contributor-guide")) {
    return "contributing";
  }
  if (normalized.startsWith("getting-started/")) return "start_here";
  if (normalized.startsWith("luthor-headless/")) return "luthor_headless";
  if (normalized.startsWith("luthor/")) return "luthor";
  if (normalized.startsWith("integrations/")) return "integrations";
  if (normalized.startsWith("reference/")) return "reference";
  return "other";
}

function inferNavOrder(data) {
  const raw = data.navOrder;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 9999;
}

async function* walkMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdownFiles(fullPath);
      continue;
    }

    if (!entry.isFile() || !isMarkdownFile(entry.name)) continue;
    yield fullPath;
  }
}

function generateDocsIndexSource(docsIndex) {
  return `/* eslint-disable */\n// This file is auto-generated by apps/web/scripts/sync-docs.mjs.\nexport const docsIndex = ${JSON.stringify(docsIndex, null, 2)};\n`;
}

function generateDocsApiIndexSource(docsApiIndex) {
  return `/* eslint-disable */\n// This file is auto-generated by apps/web/scripts/sync-docs.mjs.\nexport const docsApiIndex = ${JSON.stringify(docsApiIndex, null, 2)};\n`;
}

async function syncDocs() {
  const sourceStats = await stat(SOURCE_DOCS_DIR);
  if (!sourceStats.isDirectory()) {
    throw new Error(`Expected directory at ${SOURCE_DOCS_DIR}`);
  }

  await mkdir(path.dirname(GENERATED_DOCS_INDEX_FILE), { recursive: true });

  const validationErrors = [];
  let indexedFiles = 0;
  const docsIndex = [];
  const docsApiIndex = [];

  for await (const sourceFile of walkMarkdownFiles(SOURCE_DOCS_DIR)) {
    const relativePath = path.relative(SOURCE_DOCS_DIR, sourceFile);
    const fileLabel = `docs/${relativePath.replace(/\\/g, "/")}`;

    const markdown = await readFile(sourceFile, "utf8");
    const fallbackTitle = buildTitle(markdown, sourceFile);
    const withLuthorLinks = linkLuthorMentions(markdown);
    const nextContent = await rewriteMarkdownLinks(withLuthorLinks, sourceFile);
    const { data, content } = matter(nextContent);
    const sourceFileStats = await stat(sourceFile);

    for (const field of REQUIRED_FRONTMATTER_FIELDS) {
      if (!(field in data)) {
        validationErrors.push(`${fileLabel}: missing required frontmatter field "${field}".`);
      }
    }

    const title = assertStringField(fileLabel, data, "title", validationErrors) || fallbackTitle;
    const description =
      assertStringField(fileLabel, data, "description", validationErrors) ||
      `Reference documentation for ${title}.`;
    const packageName = assertStringField(fileLabel, data, "package", validationErrors, {
      validValues: VALID_PACKAGE_VALUES,
    });
    const docType = assertStringField(fileLabel, data, "docType", validationErrors, {
      validValues: VALID_DOC_TYPE_VALUES,
    });
    const surface = assertStringField(fileLabel, data, "surface", validationErrors, {
      validValues: VALID_SURFACE_VALUES,
    });

    const keywords = assertStringArrayField(fileLabel, data, "keywords", validationErrors);
    const exportsField = assertStringArrayField(fileLabel, data, "exports", validationErrors);
    const commandsField = assertStringArrayField(fileLabel, data, "commands", validationErrors);
    const extensionsField = assertStringArrayField(fileLabel, data, "extensions", validationErrors);
    const nodesField = assertStringArrayField(fileLabel, data, "nodes", validationErrors);
    const frameworksField = assertStringArrayField(fileLabel, data, "frameworks", validationErrors);
    const lastVerifiedFrom = assertStringArrayField(fileLabel, data, "lastVerifiedFrom", validationErrors);
    const propsField = Array.isArray(data.props)
      ? assertStringArrayField(fileLabel, data, "props", validationErrors)
      : [];

    const urlPath = toDocsReferenceUrl(relativePath);
    const slug = toSlugFromRelativePath(relativePath);
    const navGroup = inferNavGroup(relativePath, packageName, data.navGroup);
    if (data.navGroup && !VALID_NAV_GROUP_VALUES.has(data.navGroup)) {
      validationErrors.push(
        `${fileLabel}: invalid "navGroup" value "${String(data.navGroup)}". Allowed: ${[...VALID_NAV_GROUP_VALUES].join(", ")}.`,
      );
    }

    const navOrder = inferNavOrder(data);
    const navTitle =
      typeof data.navTitle === "string" && data.navTitle.trim()
        ? data.navTitle.trim()
        : title;
    const navHidden = data.navHidden === true;

    const { headings, sections } = parseHeadingsAndSections(content);
    const plainContent = stripMarkdownToPlainText(content);

    const keywordTokens = normalizeTokenList([...keywords, ...propsField]);
    const exportTokens = normalizeTokenList(exportsField);
    const commandTokens = normalizeTokenList(commandsField);
    const extensionTokens = normalizeTokenList(extensionsField);
    const nodeTokens = normalizeTokenList(nodesField);
    const frameworkTokens = normalizeTokenList(frameworksField);
    const propTokens = normalizeTokenList(propsField);
    const allTokens = normalizeTokenList([
      title,
      description,
      ...keywords,
      ...propsField,
      ...exportsField,
      ...commandsField,
      ...extensionsField,
      ...nodesField,
      ...frameworksField,
    ]);

    docsIndex.push({
      slug,
      title,
      navTitle,
      description,
      content,
      plainContent,
      sections,
      headings,
      urlPath,
      sourcePath: path.relative(REPO_ROOT, sourceFile).replace(/\\/g, "/"),
      updatedAt: sourceFileStats.mtime.toISOString(),
      package: packageName,
      docType,
      surface,
      keywords,
      props: propsField,
      exports: exportsField,
      commands: commandsField,
      extensions: extensionsField,
      nodes: nodesField,
      frameworks: frameworksField,
      lastVerifiedFrom,
      navGroup,
      navOrder,
      navHidden,
      searchTokens: allTokens,
      searchTokenBuckets: {
        keywords: keywordTokens,
        props: propTokens,
        exports: exportTokens,
        commands: commandTokens,
        extensions: extensionTokens,
        nodes: nodeTokens,
        frameworks: frameworkTokens,
      },
    });

    docsApiIndex.push({
      urlPath,
      title,
      package: packageName,
      docType,
      surface,
      navGroup,
      searchTokenBuckets: {
        keywords: keywordTokens,
        props: propTokens,
        exports: exportTokens,
        commands: commandTokens,
        extensions: extensionTokens,
        nodes: nodeTokens,
        frameworks: frameworkTokens,
      },
      searchTokens: allTokens,
    });

    indexedFiles += 1;
  }

  if (validationErrors.length > 0) {
    const message = [
      `Frontmatter validation failed for ${validationErrors.length} issue(s):`,
      ...validationErrors.map((entry) => `- ${entry}`),
    ].join("\n");
    throw new Error(message);
  }

  docsIndex.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
  docsApiIndex.sort((a, b) => a.urlPath.localeCompare(b.urlPath));

  await writeFile(GENERATED_DOCS_INDEX_FILE, generateDocsIndexSource(docsIndex), "utf8");
  await writeFile(GENERATED_DOCS_API_INDEX_FILE, generateDocsApiIndexSource(docsApiIndex), "utf8");

  console.log(
    `Indexed ${indexedFiles} documentation files from ${SOURCE_DOCS_DIR} and generated docs index + API index.`,
  );
}

syncDocs().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
