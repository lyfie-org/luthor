import Link from 'next/link';
import metadata from '@/data/package-metadata.json';
import { SEO_FAQS } from '@/config/site';
import { getAllDocs } from '@/features/docs/docs.service';
import { ExtensiveEditorShell } from '@/features/editor/extensive-editor-shell';
import { CopyInstallButton } from '@/features/home/copy-install-button';
import { HomeJsonLd } from '@/features/home/home-json-ld';
import { formatBytes, formatCompact } from '@/utils/format';

const valueProps = [
  {
    title: 'Free And MIT Licensed',
    description:
      'Luthor is open source and commercially friendly, so your editor stack stays under your control.',
    proof: 'No lock-in',
  },
  {
    title: 'Built On Lexical',
    description:
      "Runtime behavior is powered by Lexical for responsive typing, stable selection handling, and scalable rich text state.",
    proof: 'Proven core',
  },
  {
    title: 'TypeScript First APIs',
    description:
      'Typed APIs make editor integration safer and easier to maintain in real production React applications.',
    proof: 'Predictable integration',
  },
  {
    title: 'Headless Or Plug And Play',
    description:
      'Use the preset package for instant shipping or move into headless primitives when you need deep product customization.',
    proof: 'Flexible architecture',
  },
];

const stats = {
  weeklyDownloads: formatCompact(metadata.metrics?.weeklyDownloads),
  latestVersion: metadata.metrics?.latestVersion ?? 'N/A',
  minzippedSize: formatBytes(metadata.metrics?.minzippedSizeBytes),
  githubStars: formatCompact(metadata.metrics?.githubStars),
};

const fetchedDate = metadata.fetchedAt ? new Date(metadata.fetchedAt).toLocaleString('en-US') : 'N/A';

function getDocIntentLabel(urlPath: string): string {
  if (urlPath.startsWith('/docs/reference/user/')) return 'User Guide';
  if (urlPath.startsWith('/docs/reference/developer/')) return 'Developer Guide';
  if (urlPath.startsWith('/docs/reference/tutorials/')) return 'Tutorial';
  if (urlPath.startsWith('/docs/reference/readmes/')) return 'Reference';
  return 'Core Docs';
}

export default async function HomePage() {
  const docs = await getAllDocs();
  const highlightedDocs = docs.slice(0, 10);

  return (
    <>
      <HomeJsonLd />

      <section className="section hero-stage">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Open source React + Lexical editor</span>
            <h1 className="hero-title">Luthor is a modern React rich text editor built for speed, clarity, and control.</h1>
            <p className="hero-copy">
              Ship a production-ready rich text editor in minutes with the Extensive preset, then scale into a deeply
              customizable headless architecture as your product evolves.
            </p>
            <p className="hero-live-note">Read the docs, run the demo, and evaluate the full source code today.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/docs/getting-started/">
                Read docs
              </Link>
              <Link className="btn btn-muted" href="/demo/">
                Open full demo
              </Link>
            </div>
          </div>

          <div className="browser-frame">
            <div className="browser-frame-header">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="install-row">
                <code className="install-chip">npm install @lyfie/luthor react react-dom</code>
                <CopyInstallButton />
              </div>
            </div>
            <div className="editor-pane">
              <ExtensiveEditorShell />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why developers choose Luthor over bloated editor stacks.</h2>
          <p className="section-copy">
            Luthor focuses on clean APIs, realistic bundle behavior, and full ownership of the editor experience for product
            teams.
          </p>
          <div className="value-grid">
            {valueProps.map((item) => (
              <article className="value-card" key={item.title}>
                <p className="value-proof">{item.proof}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <p className="value-tailline">Free forever. Open forever. Stable today.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Package momentum and credibility signals.</h2>
          <p className="section-copy">
            Build-time metadata from npm and GitHub is exposed as crawlable plain text so developers and bots can validate
            project momentum quickly.
          </p>
          <div className="stats-badge-row">
            <article className="metric metric-badge">
              <p className="metric-label">Weekly downloads</p>
              <p className="metric-value">{stats.weeklyDownloads}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">Version</p>
              <p className="metric-value">{stats.latestVersion}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">Bundle size</p>
              <p className="metric-value">{stats.minzippedSize}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">GitHub stars</p>
              <p className="metric-value">{stats.githubStars}</p>
            </article>
          </div>
          <div className="link-row">
            <a className="btn btn-muted" href={metadata.npmUrl} target="_blank" rel="noopener noreferrer">
              NPM package
            </a>
            <a className="btn btn-muted" href={metadata.githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
            <a className="btn btn-primary" href={metadata.sponsorsUrl} target="_blank" rel="noopener noreferrer">
              Support the project
            </a>
          </div>
          <p className="mono-small">
            Data sources: npm downloads API, npm registry API, Bundlephobia API, GitHub API. Last sync: {fetchedDate}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container docs-teaser">
          <h2 className="section-title">Documentation map for implementation teams and AI agents.</h2>
          <p className="section-copy">
            The website serves markdown-first documentation with static URLs for high crawler readability, including user
            guides, architecture notes, and package-level references.
          </p>
          <ul className="doc-link-grid">
            {highlightedDocs.map((doc) => (
              <li key={doc.urlPath}>
                <Link href={doc.urlPath}>
                  <span>{doc.title}</span>
                  <small>{getDocIntentLabel(doc.urlPath)}</small>
                </Link>
              </li>
            ))}
          </ul>
          <p className="section-copy">
            Full AI corpus files: <a href="/llms.txt">llms.txt</a> and <a href="/llms-full.txt">llms-full.txt</a>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container keyword-strip">
          <h2 className="section-title">Frequently asked questions.</h2>
          <div className="faq-grid">
            {SEO_FAQS.map((item) => (
              <article key={item.question} className="faq-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
