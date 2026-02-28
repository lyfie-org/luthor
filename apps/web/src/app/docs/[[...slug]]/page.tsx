import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, BookOpenText, House, Package, RocketLaunch, SquaresFour } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ReactNode, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_NAME } from '@/config/site';
import { DocsCodeBlock } from '@/features/docs/docs-code-block';
import { DocsSearch } from '@/features/docs/docs-search';
import { getAllDocs, getAllDocSlugs, getDocBySlug } from '@/features/docs/docs.service';

type Params = { slug?: string[] };
type NavGroupId = 'getting_started' | 'luthor_headless' | 'luthor' | 'other';

const NAV_GROUP_ORDER: { id: NavGroupId; label: string }[] = [
  { id: 'getting_started', label: 'Getting Started' },
  { id: 'luthor_headless', label: '@lyfie/luthor-headless' },
  { id: 'luthor', label: '@lyfie/luthor' },
  { id: 'other', label: 'Other' },
];

const NAV_GROUP_ICONS: Record<NavGroupId, ReactNode> = {
  getting_started: <RocketLaunch size={14} weight="duotone" aria-hidden="true" />,
  luthor_headless: <SquaresFour size={14} weight="duotone" aria-hidden="true" />,
  luthor: <Package size={14} weight="duotone" aria-hidden="true" />,
  other: <BookOpenText size={14} weight="duotone" aria-hidden="true" />,
};

const GROUP_ENTRY_ORDER: Partial<Record<NavGroupId, string[]>> = {
  getting_started: [
    '/docs/getting-started/',
    '/docs/getting-started/installation/',
    '/docs/getting-started/luthor-headless/',
    '/docs/getting-started/luthor/',
  ],
  luthor_headless: [
    '/docs/luthor-headless/features/',
    '/docs/luthor-headless/features/typography-and-text/',
    '/docs/luthor-headless/features/structure-and-lists/',
    '/docs/luthor-headless/features/media-and-embeds/',
    '/docs/luthor-headless/features/code-and-devtools/',
    '/docs/luthor-headless/features/interaction-and-productivity/',
    '/docs/luthor-headless/features/customization-and-theming/',
  ],
  luthor: [
    '/docs/luthor/presets/',
    '/docs/luthor/presets/extensive-editor/',
    '/docs/luthor/presets/simple-text-editor/',
    '/docs/luthor/presets/rich-text-box-editor/',
    '/docs/luthor/presets/chat-window-editor/',
    '/docs/luthor/presets/email-compose-editor/',
    '/docs/luthor/presets/md-text-editor/',
    '/docs/luthor/presets/notion-like-editor/',
    '/docs/luthor/presets/headless-editor-preset/',
    '/docs/luthor/presets/notes-editor/',
  ],
};

type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
};

const BREADCRUMB_DEFAULT_ROUTES: Record<string, string> = {
  '/docs/getting-started/': '/docs/getting-started/',
  '/docs/luthor-headless/': '/docs/luthor-headless/features/',
  '/docs/luthor/': '/docs/luthor/presets/',
};

function resolveHref(href: string): string {
  if (!href) return '#';
  if (href.endsWith('.md') || href.endsWith('.mdx')) {
    const withoutExt = href.replace(/\.(md|mdx)$/i, '');
    return withoutExt.endsWith('/') ? withoutExt : `${withoutExt}/`;
  }
  return href;
}

function getNavGroupId(urlPath: string): NavGroupId {
  if (urlPath.startsWith('/docs/getting-started/')) return 'getting_started';
  if (urlPath.startsWith('/docs/luthor-headless/')) return 'luthor_headless';
  if (urlPath.startsWith('/docs/luthor/')) return 'luthor';
  return 'other';
}

function buildNavGroups(docs: Awaited<ReturnType<typeof getAllDocs>>) {
  const grouped = new Map<NavGroupId, Awaited<ReturnType<typeof getAllDocs>>>();

  for (const doc of docs) {
    const groupId = getNavGroupId(doc.urlPath);
    const current = grouped.get(groupId) ?? [];
    current.push(doc);
    grouped.set(groupId, current);
  }

  for (const [groupId, entries] of grouped.entries()) {
    const order = GROUP_ENTRY_ORDER[groupId];
    if (!order || order.length === 0) {
      entries.sort((a, b) => a.title.localeCompare(b.title));
      grouped.set(groupId, entries);
      continue;
    }

    const orderIndex = new Map(order.map((url, index) => [url, index]));
    entries.sort((a, b) => {
      const aIndex = orderIndex.get(a.urlPath);
      const bIndex = orderIndex.get(b.urlPath);

      if (typeof aIndex === 'number' && typeof bIndex === 'number') return aIndex - bIndex;
      if (typeof aIndex === 'number') return -1;
      if (typeof bIndex === 'number') return 1;
      return a.title.localeCompare(b.title);
    });
    grouped.set(groupId, entries);
  }

  return NAV_GROUP_ORDER.filter((group) => grouped.has(group.id)).map((group) => ({
    ...group,
    entries: grouped.get(group.id)!,
  }));
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildBreadcrumbs(slug: string[]): BreadcrumbItem[] {
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
    breadcrumbs.push({
      label: toTitleCase(segment),
      href: isLast ? undefined : breadcrumbHref,
    });
  }

  return breadcrumbs;
}

function extractCodeBlock(children: ReactNode): { code: string; language?: string } | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return null;
  const className = typeof children.props.className === 'string' ? children.props.className : '';
  const languageMatch = className.match(/language-([a-z0-9]+)/i);
  const language = languageMatch?.[1]?.toLowerCase();
  const raw = children.props.children;
  const code = Array.isArray(raw) ? raw.join('') : String(raw ?? '');

  return {
    code: code.replace(/\n$/, ''),
    language,
  };
}

function buildSearchableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800);
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
    keywords: [doc.title, 'luthor docs', 'react rich text editor docs', 'lexical editor docs'],
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
  const navGroups = buildNavGroups(allDocs);
  const orderedDocs = navGroups.flatMap((group) => group.entries);
  const currentIndex = orderedDocs.findIndex((entry) => entry.urlPath === doc.urlPath);
  const previousDoc = currentIndex > 0 ? orderedDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < orderedDocs.length - 1 ? orderedDocs[currentIndex + 1] : null;
  const searchDocs = allDocs.map((entry) => ({
    urlPath: entry.urlPath,
    title: entry.title,
    description: entry.description,
    searchableText: buildSearchableText(entry.content),
  }));
  const breadcrumbs = buildBreadcrumbs(slug);

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
        url: 'https://www.luthor.fyi/favicon.svg',
      },
    },
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
                          {entry.title}
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
          <article className="docs-article">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="doc-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    const nextHref = resolveHref(href ?? '#');
                    const isInternal = nextHref.startsWith('/');
                    if (!isInternal) {
                      return (
                        <a href={nextHref} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      );
                    }
                    return <Link href={nextHref}>{children}</Link>;
                  },
                  pre: ({ children }) => {
                    const extracted = extractCodeBlock(children);
                    if (!extracted) return <pre>{children}</pre>;
                    return <DocsCodeBlock code={extracted.code} language={extracted.language} />;
                  },
                }}
              >
                {doc.content}
              </ReactMarkdown>
            </div>
            <nav className="docs-pager" aria-label="Documentation pagination">
              <div>
                {previousDoc ? (
                  <Link href={previousDoc.urlPath} rel="prev">
                    <ArrowLeft size={14} weight="bold" aria-hidden="true" />
                    <span>Previous: {previousDoc.title}</span>
                  </Link>
                ) : null}
              </div>
              <div>
                {nextDoc ? (
                  <Link href={nextDoc.urlPath} rel="next">
                    <span>Next: {nextDoc.title}</span>
                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </nav>
          </article>
          </div>
        </div>
      </div>
    </section>
  );
}
