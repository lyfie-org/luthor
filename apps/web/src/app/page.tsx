import {
  BracketsCurly,
  CheckCircle,
  DownloadSimple,
  GitCommit,
  GithubLogo,
  Package,
  RocketLaunch,
  ShieldCheck,
  Sparkle,
  StackSimple,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {
  GITHUB_URL,
  HEADLESS_PACKAGE_NAME,
  NPM_URL,
  PRIMARY_PACKAGE_NAME,
  SEO_FAQS,
  SPONSORS_URL,
} from '@/config/site';
import { ExtensiveEditorShell } from '@/features/editor/extensive-editor-shell';
import { HomeJsonLd } from '@/features/home/home-json-ld';
import { LocalLastSync } from '@/features/home/local-last-sync';
import { WhyLuthorFeatures } from '@/features/home/why-luthor-features';
import { WhyLuthorReasons } from '@/features/home/why-luthor-reasons';
import { formatCompact } from '@/utils/format';

type DownloadPointResponse = {
  downloads?: number;
};

type RegistryResponse = {
  'dist-tags'?: {
    latest?: string;
  };
  versions?: Record<string, unknown>;
  time?: {
    created?: string;
  };
};

type GitHubCommitResponse = {
  commit?: {
    committer?: {
      date?: string;
    };
  };
};

const packagePlans = [
  {
    tone: 'headless',
    name: 'Luthor Headless',
    packageName: HEADLESS_PACKAGE_NAME,
    tag: 'Full Control',
    description: 'Composable primitives for teams that want total UI freedom.',
    features: [
      'Build your exact editor UX',
      'Extensive Customization API',
      'Fine-grained command control',
      'Bring your own design system',
      'Perfect for product-specific flows',
      'Zero dependencies within package for maximum flexibility',
    ],
  },
  {
    tone: 'luthor',
    name: 'Luthor',
    packageName: PRIMARY_PACKAGE_NAME,
    tag: 'Full Control + Ready To Ship',
    description: 'Prebuilt editor presets with extensive customizability',
    features: [
      'One-liner editor configuration',
      'Single package for all your editor needs',
      'Polished toolbar and extensions',
      'Type-safe React integration',
      'Built for production speed',
      'Includes Luthor Headless for maximum flexibility',
    ],
  },
];

const heroUseCases = [
  { label: 'AI Actions', icon: Sparkle },
  { label: 'Apps', icon: Package },
  { label: 'Chat', icon: RocketLaunch },
  { label: 'Blog', icon: BracketsCurly },
  { label: 'Email', icon: StackSimple },
  { label: 'Teams', icon: ShieldCheck },
] as const;

const modernBuildHighlights = [
  {
    label: 'Package footprint advantage',
    detail: 'Up to 14.3x smaller zipped package size than major editor alternatives.',
  },
  {
    label: 'ESM-first architecture',
    detail: 'CJS removed. ESM-only output unlocks cleaner modern bundling and tree-shaking.',
  },
  {
    label: 'Lean browser payload',
    detail: '@lyfie/luthor-headless: 141.27 KB minified / 36.65 KB gzipped.',
  },
  {
    label: 'Ship faster',
    detail: 'Production-ready UI presets plus headless flexibility in one ecosystem.',
  },
] as const;

const compatibilityRows = [
  {
    label: 'Node.js',
    version: '>=20',
    detail: 'Modern Node runtime for local dev, build, and CI.',
  },
  {
    label: 'React',
    version: '^18.0.0 || ^19.0.0',
    detail: 'Works with current React app stacks.',
  },
  {
    label: 'React DOM',
    version: '^18.0.0 || ^19.0.0',
    detail: 'Fully aligned with supported React versions.',
  },
  {
    label: 'TypeScript',
    version: 'TypeScript-first',
    detail: 'Typed APIs and shipped declarations out of the box.',
  },
  {
    label: 'Lexical',
    version: '^0.40.0 (luthor), >=0.40.0 (headless peers)',
    detail: 'Stable integration path with the latest Luthor architecture.',
  },
  {
    label: 'Frameworks',
    version: 'Modern ESM React frameworks',
    detail: 'Next.js, Vite, Remix, and similar React setups.',
  },
] as const;

async function safeFetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function toIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getLiveStats() {
  const [luthorRegistry, headlessRegistry, latestMainCommit] = await Promise.all([
    safeFetchJson<RegistryResponse>(`https://registry.npmjs.org/${encodeURIComponent(PRIMARY_PACKAGE_NAME)}`),
    safeFetchJson<RegistryResponse>(`https://registry.npmjs.org/${encodeURIComponent(HEADLESS_PACKAGE_NAME)}`),
    safeFetchJson<GitHubCommitResponse>('https://api.github.com/repos/lyfie-app/luthor/commits/main'),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const luthorCreatedDate = toIsoDate(luthorRegistry?.time?.created);
  const headlessCreatedDate = toIsoDate(headlessRegistry?.time?.created);

  const [luthorTotalDownloads, headlessTotalDownloads] = await Promise.all([
    luthorCreatedDate
      ? safeFetchJson<DownloadPointResponse>(
          `https://api.npmjs.org/downloads/point/${luthorCreatedDate}:${today}/${encodeURIComponent(PRIMARY_PACKAGE_NAME)}`,
        )
      : Promise.resolve(null),
    headlessCreatedDate
      ? safeFetchJson<DownloadPointResponse>(
          `https://api.npmjs.org/downloads/point/${headlessCreatedDate}:${today}/${encodeURIComponent(HEADLESS_PACKAGE_NAME)}`,
        )
      : Promise.resolve(null),
  ]);

  const luthorTotal = typeof luthorTotalDownloads?.downloads === 'number' ? luthorTotalDownloads.downloads : null;
  const headlessTotal = typeof headlessTotalDownloads?.downloads === 'number' ? headlessTotalDownloads.downloads : null;
  const totalDownloads =
    typeof luthorTotal === 'number' || typeof headlessTotal === 'number'
      ? (luthorTotal ?? 0) + (headlessTotal ?? 0)
      : null;

  const latestVersion = luthorRegistry?.['dist-tags']?.latest ?? 'N/A';
  const luthorReleaseCount = luthorRegistry?.versions ? Object.keys(luthorRegistry.versions).length : 0;
  const headlessReleaseCount = headlessRegistry?.versions ? Object.keys(headlessRegistry.versions).length : 0;
  const releaseCount =
    luthorReleaseCount > 0 || headlessReleaseCount > 0 ? luthorReleaseCount + headlessReleaseCount : null;
  const latestCommitDate = latestMainCommit?.commit?.committer?.date ?? null;

  const hasLiveData = Boolean(
    luthorRegistry || headlessRegistry || latestMainCommit || luthorTotalDownloads || headlessTotalDownloads,
  );

  return {
    totalDownloads: formatCompact(totalDownloads),
    latestVersion,
    latestCommitDate: formatDate(latestCommitDate),
    releaseCount: formatCompact(releaseCount),
    fetchedAtIso: hasLiveData ? new Date().toISOString() : null,
  };
}

export default async function HomePage() {
  const stats = await getLiveStats();

  return (
    <>
      <HomeJsonLd />

      <section className="section hero-stage">
        <div className="container hero-grid">
          <div className="hero-heading-container">
            <span className="eyebrow">Open Source & MIT Licensed</span>
            <h1 className="hero-title">Editor That <span className="hero-highlight-title">Refuses</span> To Be Boring</h1>
            <p className="hero-copy">
              Type-safe, open-source, typescript friendly and <span className="hero-highlight-text">Lexical Based</span> rich text editor built for <span className="hero-highlight-text">React</span>
              {' '} - designed for developers who want control without chaos. Every feature. <span className="hero-highlight-text"> Zero fluff. No paywalls. No nonsense.</span>
            </p>
            <p className="hero-live-note">Free forever. Open forever. Ready for your next project.</p>
            <div className="hero-uses-container">
              {heroUseCases.map((useCase) => (
                <span className="eyebrow-muted" key={useCase.label}>
                  <useCase.icon size={14} weight="duotone" aria-hidden="true" />
                  <span>{useCase.label}</span>
                </span>
              ))}
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/docs/getting-started/">
                <RocketLaunch className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
                <span>Get Started</span>
              </Link>
              <Link className="btn btn-muted" href={GITHUB_URL}>
                <GithubLogo className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
                <span>View on GitHub</span>
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
            </div>
            <div className="editor-pane">
              <ExtensiveEditorShell syncWithSiteTheme />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Luthor vs Luthor Headless</h2>
          <p className="section-copy">
            Pick the package that matches how quickly you want to ship and how much UI control you need.
          </p>
          <div className="plan-grid">
            {packagePlans.map((plan) => (
              <article className={`plan-card plan-card--${plan.tone}`} key={plan.name}>
                <div className="plan-header">
                  <h3 className="plan-title">
                    {plan.tone === 'luthor' ? (
                      <Package size={18} weight="duotone" aria-hidden="true" />
                    ) : (
                      <BracketsCurly size={18} weight="duotone" aria-hidden="true" />
                    )}
                    <span>{plan.name}</span>
                  </h3>
                  <span className="plan-eyebrow">{plan.tag}</span>
                </div>
                <p className="plan-package">{plan.packageName}</p>
                <p>{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle size={14} weight="fill" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Luthor?</h2>
          <p className="section-copy">
            Built for teams that need control, reliability, and speed in production editors.
          </p>
          <WhyLuthorReasons />
        </div>
      </section>

      <section className="section">
        <div className="container modern-shell">
          <h2 className="section-title">Built On Modern. Built For Modern.</h2>
          <p className="section-copy">
            ESM-only architecture, strong tree-shaking behavior, and a lightweight package footprint designed for modern
            production apps.
          </p>

          <div className="modern-highlight-grid">
            {modernBuildHighlights.map((item) => (
              <article key={item.label} className="modern-highlight-card">
                <p className="metric-label">{item.label}</p>
                <p className="metric-value modern-highlight-value">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <p className="section-copy">
            Click any feature to see a deeper breakdown and preview.
          </p>
          <WhyLuthorFeatures />
        </div>
      </section>

      <section className="section">
        <div className="container support-shell">
          <h2 className="section-title">Works With Your Stack</h2>
          <p className="section-copy">
            Plug Luthor into modern React workflows quickly with predictable version support.
          </p>
          <div className="support-grid" role="list" aria-label="Compatibility highlights">
            {compatibilityRows.map((row) => (
              <article key={row.label} className="support-card" role="listitem">
                <p className="metric-label">{row.label}</p>
                <p className="support-version">{row.version}</p>
                <p className="support-detail">{row.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stats-badge-row">
            <article className="metric metric-badge">
              <p className="metric-label">
                <DownloadSimple size={14} weight="duotone" aria-hidden="true" />
                <span>Total downloads</span>
              </p>
              <p className="metric-value">{stats.totalDownloads}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">
                <Package size={14} weight="duotone" aria-hidden="true" />
                <span>Version</span>
              </p>
              <p className="metric-value">{stats.latestVersion}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">
                <GitCommit size={14} weight="duotone" aria-hidden="true" />
                <span>Latest main commit</span>
              </p>
              <p className="metric-value">{stats.latestCommitDate}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">
                <StackSimple size={14} weight="duotone" aria-hidden="true" />
                <span>Published releases</span>
              </p>
              <p className="metric-value">{stats.releaseCount}</p>
            </article>
          </div>
          <div className="link-row">
            <a className="btn btn-muted" href={NPM_URL} target="_blank" rel="noopener noreferrer">
              <Package className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>NPM package</span>
            </a>
            <a className="btn btn-muted" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GithubLogo className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>GitHub repository</span>
            </a>
            <a className="btn btn-primary" href={SPONSORS_URL} target="_blank" rel="noopener noreferrer">
              <Sparkle className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>Support the project</span>
            </a>
          </div>
          <p className="mono-small">
            Data sources: npm downloads API, npm registry API, GitHub API. Last sync: <LocalLastSync isoTimestamp={stats.fetchedAtIso} />
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container faq-shell">
          <h2 className="section-title">Frequently asked questions.</h2>
          <div className="faq-grid">
            {SEO_FAQS.map((item) => (
              <details key={item.question} className="faq-item">
                <summary className="faq-question">
                  <span>{item.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="faq-answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
