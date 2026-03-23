import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, BookOpenText, House, Package, RocketLaunch, SquaresFour, Stack } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { type HTMLAttributes, ReactNode, createElement, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FeatureGifImage } from '@/components/media/feature-gif-image';
import { DEVTO_ARTICLE_URL, MEDIUM_ARTICLE_URL, SITE_NAME } from '@/config/site';
import { DocsCodeBlock, type DocsCodeTab } from '@/features/docs/docs-code-block';
import { DocsSearch } from '@/features/docs/docs-search';
import { type DocEntry, getAllDocs, getAllDocSlugs, getDocBySlug } from '@/features/docs/docs.service';
import { isExternalWebsiteHref } from '@/utils/link';

type Params = { slug?: string[] };
type NavGroupId = 'start_here' | 'luthor_headless' | 'luthor' | 'integrations' | 'reference' | 'contributing' | 'other';

const NAV_GROUP_ORDER: { id: NavGroupId; label: string }[] = [
  { id: 'start_here', label: 'Start Here' },
  { id: 'luthor', label: '@lyfie/luthor (Presets)' },
  { id: 'luthor_headless', label: '@lyfie/luthor-headless (Runtime)' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'reference', label: 'Reference Indexes' },
  { id: 'contributing', label: 'Contributing' },
  { id: 'other', label: 'Other' },
];

const NAV_GROUP_ICONS: Record<NavGroupId, ReactNode> = {
  start_here: <RocketLaunch size={14} weight="duotone" aria-hidden="true" />,
  luthor_headless: <SquaresFour size={14} weight="duotone" aria-hidden="true" />,
  luthor: <Package size={14} weight="duotone" aria-hidden="true" />,
  integrations: <Stack size={14} weight="duotone" aria-hidden="true" />,
  reference: <BookOpenText size={14} weight="duotone" aria-hidden="true" />,
  contributing: <BookOpenText size={14} weight="duotone" aria-hidden="true" />,
  other: <BookOpenText size={14} weight="duotone" aria-hidden="true" />,
};

const PINNED_NAV_ORDER = new Map<string, number>([
  ['/docs/getting-started/', 0],
  ['/docs/luthor/overview/', 1],
  ['/docs/luthor-headless/overview/', 2],
  ['/docs/integrations/react/', 3],
  ['/docs/reference/search-guide/', 4],
  ['/docs/getting-started/contributor-guide/', 5],
]);

type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
};

const BREADCRUMB_DEFAULT_ROUTES: Record<string, string> = {
  '/docs/getting-started/': '/docs/getting-started/',
  '/docs/luthor/': '/docs/luthor/overview/',
  '/docs/luthor-headless/': '/docs/luthor-headless/overview/',
  '/docs/integrations/': '/docs/integrations/react/',
  '/docs/reference/': '/docs/reference/search-guide/',
};
const TAB_BLOCK_LANGUAGE = 'luthor-tabs';
const TAB_BLOCK_PLACEHOLDER_PREFIX = '__LUTHOR_CODE_TABS__:';

type MarkdownHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  children?: ReactNode;
};

function resolveHref(href: string): string {
  if (!href) return '#';
  if (href.endsWith('.md') || href.endsWith('.mdx')) {
    const withoutExt = href.replace(/\.(md|mdx)$/i, '');
    return withoutExt.endsWith('/') ? withoutExt : `${withoutExt}/`;
  }
  return href;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeNavGroup(doc: DocEntry): NavGroupId {
  if (doc.navGroup === 'start_here') return 'start_here';
  if (doc.navGroup === 'luthor') return 'luthor';
  if (doc.navGroup === 'luthor_headless') return 'luthor_headless';
  if (doc.navGroup === 'integrations') return 'integrations';
  if (doc.navGroup === 'reference') return 'reference';
  if (doc.navGroup === 'contributing') return 'contributing';
  return 'other';
}

function buildNavGroups(docs: DocEntry[]) {
  const visibleDocs = docs.filter((doc) => doc.navHidden !== true);
  const grouped = new Map<NavGroupId, DocEntry[]>();

  for (const doc of visibleDocs) {
    const groupId = normalizeNavGroup(doc);
    const current = grouped.get(groupId) ?? [];
    current.push(doc);
    grouped.set(groupId, current);
  }

  for (const [groupId, entries] of grouped.entries()) {
    entries.sort((a, b) => {
      const pinnedA = PINNED_NAV_ORDER.get(a.urlPath);
      const pinnedB = PINNED_NAV_ORDER.get(b.urlPath);
      if (typeof pinnedA === 'number' && typeof pinnedB === 'number') return pinnedA - pinnedB;
      if (typeof pinnedA === 'number') return -1;
      if (typeof pinnedB === 'number') return 1;
      if (a.navOrder !== b.navOrder) return a.navOrder - b.navOrder;
      return a.navTitle.localeCompare(b.navTitle);
    });
    grouped.set(groupId, entries);
  }

  return NAV_GROUP_ORDER.filter((group) => grouped.has(group.id)).map((group) => ({
    ...group,
    entries: grouped.get(group.id)!,
  }));
}

function buildDocsByPathMap(docs: DocEntry[]): Map<string, DocEntry> {
  return new Map(docs.map((doc) => [doc.urlPath, doc]));
}

function buildBreadcrumbs(slug: string[], docsByPath: Map<string, DocEntry>): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <House size={14} weight="duotone" aria-hidden="true" /> },
    { label: 'Docs', href: '/docs/', icon: <BookOpenText size={14} weight="duotone" aria-hidden="true" /> },
  ];

  if (slug.length === 0) return breadcrumbs;

  let path = '/docs';
  for (let index = 0; index < slug.length; index += 1) {
    const segment = slug[index];
    if (!segment) continue;
    path += `/${segment}`;
    const isLast = index === slug.length - 1;
    const segmentPath = `${path}/`;
    const breadcrumbHref = BREADCRUMB_DEFAULT_ROUTES[segmentPath] ?? segmentPath;
    const matchingDoc = docsByPath.get(segmentPath);
    const label = matchingDoc?.navTitle ?? matchingDoc?.title ?? toTitleCase(segment);
    breadcrumbs.push({
      label,
      href: isLast ? undefined : breadcrumbHref,
    });
  }

  return breadcrumbs;
}

function extractCodeBlock(children: ReactNode): { code: string; language?: string } | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return null;
  const className = typeof children.props.className === 'string' ? children.props.className : '';
  const languageMatch = className.match(/language-([a-z0-9-]+)/i);
  const language = languageMatch?.[1]?.toLowerCase();
  const raw = children.props.children;
  const code = Array.isArray(raw) ? raw.join('') : String(raw ?? '');

  return {
    code: code.replace(/\n$/, ''),
    language,
  };
}

type ParsedFence = {
  code: string;
  language?: string;
  endIndex: number;
};

function skipBlankLines(lines: string[], startIndex: number): number {
  let index = startIndex;
  while (index < lines.length && (lines[index] ?? '').trim() === '') {
    index += 1;
  }
  return index;
}

function parseFencedCodeBlock(lines: string[], startIndex: number): ParsedFence | null {
  const openingLine = lines[startIndex];
  const openingMatch = openingLine?.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
  if (!openingMatch) return null;

  const marker = openingMatch[2];
  if (!marker) return null;
  const markerChar = marker.charAt(0);
  const markerLength = marker.length;
  const info = (openingMatch[3] ?? '').trim();
  const languageToken = info.split(/\s+/)[0];
  const language = languageToken ? languageToken.toLowerCase() : undefined;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const closingLine = (lines[index] ?? '').trim();
    const closingMatch = closingLine.match(/^(`{3,}|~{3,})\s*$/);
    if (!closingMatch) continue;

    const closingMarker = closingMatch[1];
    if (!closingMarker) continue;
    if (closingMarker.charAt(0) !== markerChar || closingMarker.length < markerLength) continue;

    return {
      code: lines.slice(startIndex + 1, index).join('\n'),
      language,
      endIndex: index,
    };
  }

  return null;
}

function isTsxLanguage(language?: string): boolean {
  return language === 'tsx' || language === 'typescriptreact';
}

function isJsxLanguage(language?: string): boolean {
  return language === 'jsx' || language === 'javascriptreact';
}

function transformTsxJsxSections(content: string): { content: string; tabBlocks: Map<string, DocsCodeTab[]> } {
  const lines = content.split('\n');
  const output: string[] = [];
  const tabBlocks = new Map<string, DocsCodeTab[]>();
  let index = 0;
  let tabBlockCount = 0;

  while (index < lines.length) {
    const tsxHeadingMatch = lines[index]?.match(/^(#{2,6})\s+tsx\s*$/i);
    if (!tsxHeadingMatch) {
      output.push(lines[index] ?? '');
      index += 1;
      continue;
    }

    const headingMarker = tsxHeadingMatch[1];
    if (!headingMarker) {
      output.push(lines[index] ?? '');
      index += 1;
      continue;
    }
    const headingLevel = headingMarker.length;
    const tsxFenceStart = skipBlankLines(lines, index + 1);
    const tsxFence = parseFencedCodeBlock(lines, tsxFenceStart);

    if (!tsxFence || !isTsxLanguage(tsxFence.language)) {
      output.push(lines[index] ?? '');
      index += 1;
      continue;
    }

    const jsxHeadingIndex = skipBlankLines(lines, tsxFence.endIndex + 1);
    const jsxHeadingMatch = lines[jsxHeadingIndex]?.match(/^(#{2,6})\s+jsx\s*$/i);
    const jsxHeadingMarker = jsxHeadingMatch?.[1];
    if (!jsxHeadingMarker || jsxHeadingMarker.length !== headingLevel) {
      output.push(lines[index] ?? '');
      index += 1;
      continue;
    }

    const jsxFenceStart = skipBlankLines(lines, jsxHeadingIndex + 1);
    const jsxFence = parseFencedCodeBlock(lines, jsxFenceStart);

    if (!jsxFence || !isJsxLanguage(jsxFence.language)) {
      output.push(lines[index] ?? '');
      index += 1;
      continue;
    }

    tabBlockCount += 1;
    const tabBlockId = `${TAB_BLOCK_PLACEHOLDER_PREFIX}${tabBlockCount}`;
    tabBlocks.set(tabBlockId, [
      { id: 'tsx', label: 'tsx', code: tsxFence.code, language: 'tsx' },
      { id: 'jsx', label: 'jsx', code: jsxFence.code, language: 'jsx' },
    ]);

    output.push(`~~~${TAB_BLOCK_LANGUAGE}`);
    output.push(tabBlockId);
    output.push('~~~');

    index = jsxFence.endIndex + 1;
  }

  return {
    content: output.join('\n'),
    tabBlocks,
  };
}

function buildSearchableText(doc: DocEntry): string {
  return [
    doc.title,
    doc.description,
    doc.urlPath,
    doc.sourcePath,
    doc.content,
    doc.searchTokens.join(' '),
  ].join('\n');
}

function flattenHeadingText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(flattenHeadingText).join('');
  if (isValidElement<{ children?: ReactNode }>(children)) return flattenHeadingText(children.props.children);
  return '';
}

function slugifyHeading(text: string): string {
  const normalized = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return normalized || 'section';
}

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  const params = slugs.map((slug) => (slug.length ? { slug } : {}));
  return params;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ?? [];
  if (slug.length === 0) {
    return {
      title: 'Documentation',
      description: 'Documentation for @lyfie/luthor and @lyfie/luthor-headless.',
      alternates: {
        canonical: '/docs/getting-started/',
      },
    };
  }
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return {
      title: 'Documentation Not Found',
      description: 'This documentation page does not exist.',
      robots: { index: false, follow: true },
    };
  }

  return {
    title: doc.title,
    description: doc.description,
    keywords: [...new Set([doc.title, ...doc.keywords])],
    alternates: {
      canonical: doc.urlPath,
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: doc.urlPath,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${doc.title} | ${SITE_NAME}`,
      description: doc.description,
    },
  };
}

export default async function DocsPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ?? [];
  if (slug.length === 0) redirect('/docs/getting-started/');
  const [doc, allDocs] = await Promise.all([getDocBySlug(slug), getAllDocs()]);

  if (!doc) notFound();
  const { content: renderedMarkdown, tabBlocks: tabbedCodeBlocks } = transformTsxJsxSections(doc.content);
  const navGroups = buildNavGroups(allDocs);
  const orderedDocs = navGroups.flatMap((group) => group.entries);
  const currentIndex = orderedDocs.findIndex((entry) => entry.urlPath === doc.urlPath);
  const previousDoc = currentIndex > 0 ? orderedDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < orderedDocs.length - 1 ? orderedDocs[currentIndex + 1] : null;
  const searchDocs = allDocs.map((entry) => ({
    urlPath: entry.urlPath,
    title: entry.title,
    description: entry.description,
    package: entry.package,
    docType: entry.docType,
    surface: entry.surface,
    sections: entry.sections,
    searchTokenBuckets: entry.searchTokenBuckets,
    searchableText: buildSearchableText(entry),
  }));
  const docsByPath = buildDocsByPathMap(allDocs);
  const breadcrumbs = buildBreadcrumbs(slug, docsByPath);
  const showProjectBackstoryLinks = doc.urlPath === '/docs/getting-started/';
  const tocHeadings = doc.headings.filter((heading) => {
    if (heading.level !== 2 && heading.level !== 3) return false;
    const normalizedHeading = heading.text.trim().toLowerCase();
    return normalizedHeading !== 'tsx' && normalizedHeading !== 'jsx';
  });
  const showToc = tocHeadings.length > 0 && (doc.docType === 'reference' || tocHeadings.length >= 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: doc.description,
    url: `https://www.luthor.fyi${doc.urlPath}`,
    dateModified: doc.updatedAt,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.luthor.fyi/favicon-32x32.png',
      },
    },
  };

  const headingSlugCounts = new Map<string, number>();
  const headingRenderer = (level: 2 | 3 | 4) =>
    function Heading({ children, ...rest }: MarkdownHeadingProps) {
      const rawText = flattenHeadingText(children).trim();
      const baseSlug = slugifyHeading(rawText);
      const nextCount = (headingSlugCounts.get(baseSlug) ?? 0) + 1;
      headingSlugCounts.set(baseSlug, nextCount);
      const id = nextCount > 1 ? `${baseSlug}-${nextCount}` : baseSlug;
      return createElement(`h${level}`, { id, ...rest }, children);
    };

  return (
    <section className="section docs-section">
      <div className="container">
        <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${item.label}-${index}`}>
                  {item.href && !isLast ? (
                    <Link href={item.href}>
                      {item.icon ?? null}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined}>
                      {item.icon ?? null}
                      <span>{item.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="docs-layout">
          <aside className="docs-sidebar" aria-label="Documentation navigation">
            <h2>Luthor Documentation</h2>
            {navGroups.map((group) => (
              <div className="docs-sidebar-group" key={group.id}>
                <h3>
                  {NAV_GROUP_ICONS[group.id]}
                  <span>{group.label}</span>
                </h3>
                <ul>
                  {group.entries.map((entry) => {
                    const isCurrent = entry.urlPath === doc.urlPath;
                    return (
                      <li key={entry.urlPath}>
                        <Link href={entry.urlPath} aria-current={isCurrent ? 'page' : undefined} className={isCurrent ? 'active' : ''}>
                          {entry.navTitle}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>
          <div className="docs-main">
            <DocsSearch docs={searchDocs} />
            <div className="docs-main-layout">
              <article className="docs-article">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <p className="docs-meta">
                  <span>Package: {doc.package}</span>
                  <span>Type: {doc.docType}</span>
                  <span>Surface: {doc.surface}</span>
                </p>
                <div className="doc-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        const nextHref = resolveHref(href ?? '#');
                        if (isExternalWebsiteHref(nextHref)) {
                          return (
                            <a href={nextHref} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          );
                        }
                        if (nextHref.startsWith('/')) return <Link href={nextHref}>{children}</Link>;
                        return <a href={nextHref}>{children}</a>;
                      },
                      h2: headingRenderer(2),
                      h3: headingRenderer(3),
                      h4: headingRenderer(4),
                      pre: ({ children }) => {
                        const extracted = extractCodeBlock(children);
                        if (!extracted) return <pre>{children}</pre>;
                        if (extracted.language === TAB_BLOCK_LANGUAGE) {
                          const tabBlockId = extracted.code.trim();
                          const tabs = tabbedCodeBlocks.get(tabBlockId);
                          if (tabs && tabs.length > 0) {
                            const primaryTab = tabs[0];
                            if (primaryTab) {
                              return <DocsCodeBlock code={primaryTab.code} language={primaryTab.language} tabs={tabs} defaultTabId="tsx" />;
                            }
                          }
                        }
                        return <DocsCodeBlock code={extracted.code} language={extracted.language} />;
                      },
                      img: ({ src, alt }) => {
                        const rawSrc = typeof src === 'string' ? src : '#';
                        const resolvedSrc = resolveHref(rawSrc);
                        const resolvedAlt = alt ?? 'Documentation image';

                        if (/^\/features\/Feature\d+\.gif$/i.test(resolvedSrc)) {
                          return (
                            <FeatureGifImage
                              src={resolvedSrc}
                              alt={resolvedAlt}
                              className="docs-feature-gif-shell"
                              imageClassName="docs-feature-gif"
                            />
                          );
                        }

                        return <img src={resolvedSrc} alt={resolvedAlt} loading="lazy" decoding="async" />;
                      },
                    }}
                  >
                    {renderedMarkdown}
                  </ReactMarkdown>
                </div>
                <nav className="docs-pager" aria-label="Documentation pagination">
                  <div>
                    {previousDoc ? (
                      <Link href={previousDoc.urlPath} rel="prev">
                        <ArrowLeft size={14} weight="bold" aria-hidden="true" />
                        <span>Previous: {previousDoc.navTitle}</span>
                      </Link>
                    ) : null}
                  </div>
                  <div>
                    {nextDoc ? (
                      <Link href={nextDoc.urlPath} rel="next">
                        <span>Next: {nextDoc.navTitle}</span>
                        <ArrowRight size={14} weight="bold" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </nav>
                {showProjectBackstoryLinks ? (
                  <p className="docs-related-reading">
                    Looking for the project backstory? Read the short posts on{' '}
                    <a href={DEVTO_ARTICLE_URL} target="_blank" rel="noopener noreferrer">dev.to</a>
                    {' '}or{' '}
                    <a href={MEDIUM_ARTICLE_URL} target="_blank" rel="noopener noreferrer">Medium</a>.
                  </p>
                ) : null}
              </article>
              {showToc ? (
                <aside className="docs-toc" aria-label="On this page">
                  <h2>On this page</h2>
                  <ul>
                    {tocHeadings.map((heading) => (
                      <li key={heading.id} data-level={heading.level}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
