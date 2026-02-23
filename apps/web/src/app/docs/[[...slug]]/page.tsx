import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_NAME } from '@/config/site';
import { getAllDocs, getAllDocSlugs, getDocBySlug } from '@/features/docs/docs.service';

type Params = { slug?: string[] };

function resolveHref(href: string): string {
  if (!href) return '#';
  if (href.endsWith('.md') || href.endsWith('.mdx')) {
    const withoutExt = href.replace(/\.(md|mdx)$/i, '');
    return withoutExt.endsWith('/') ? withoutExt : `${withoutExt}/`;
  }
  return href;
}

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  const params = slugs.map((slug) => (slug.length ? { slug } : {}));
  return params;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ?? [];
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
  const [doc, allDocs] = await Promise.all([getDocBySlug(slug), getAllDocs()]);

  if (!doc) notFound();

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
      <div className="container docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          <h2>Documentation</h2>
          <ul>
            {allDocs.map((entry) => {
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
        </aside>
        <article className="docs-article">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <h1>{doc.title}</h1>
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
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </section>
  );
}
