/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  BracketsCurly,
  CheckCircle,
  DownloadSimple,
  GithubLogo,
  Package,
  RocketLaunch,
  ShieldCheck,
  Sparkle,
  StackSimple,
} from '@phosphor-icons/react/dist/ssr';
import nextDynamic from 'next/dynamic';
import {
  CREATOR_NAME,
  CREATOR_URL,
  GITHUB_URL,
  HEADLESS_PACKAGE_NAME,
  LYFIE_HEADLESS_NPM_URL,
  LYFIE_NPM_URL,
  MAINTAINER_ORG_NAME,
  MAINTAINER_ORG_URL,
  PRIMARY_PACKAGE_NAME,
  SEO_FAQS,
  SPONSORS_URL,
} from '@/config/site';
import { homepageMetrics } from '@/data/homepage-metrics.generated';
import { HomeJsonLd } from '@/features/home/home-json-ld';
import { LocalLastSync } from '@/features/home/local-last-sync';
import { WhyLuthorReasons } from '@/features/home/why-luthor-reasons';
import { formatBytes, formatCompact } from '@/utils/format';

export const dynamic = 'force-static';
export const revalidate = false;

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
      'Type-safe framework integration',
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

const ExtensiveEditorShell = nextDynamic(
  () => import('@/features/editor/extensive-editor-shell').then((mod) => mod.ExtensiveEditorShell),
  {
    loading: () => <p className="section-copy">Loading editor demo...</p>,
  },
);

const WhyLuthorFeatures = nextDynamic(
  () => import('@/features/home/why-luthor-features').then((mod) => mod.WhyLuthorFeatures),
  {
    loading: () => <p className="section-copy">Loading feature previews...</p>,
  },
);

function getBuildTimeStats() {
  return {
    totalDownloads: formatCompact(homepageMetrics.totalDownloads),
    lastMonthDownloads: formatCompact(homepageMetrics.lastMonthDownloads),
    latestVersion: String(homepageMetrics.latestVersion),
    headlessVersion: String(homepageMetrics.headlessVersion),
    luthorPackageSize: formatBytes(homepageMetrics.luthorPackageSize),
    headlessPackageSize: formatBytes(homepageMetrics.headlessPackageSize),
    combinedPackageSize: formatBytes(homepageMetrics.combinedPackageSize),
    releaseCount: formatCompact(homepageMetrics.releaseCount),
    fetchedAtIso: homepageMetrics.fetchedAtIso,
  };
}

export default function HomePage() {
  const stats = getBuildTimeStats();
  const luthorVersionLabel =
    stats.latestVersion === 'N/A' ? PRIMARY_PACKAGE_NAME : `${PRIMARY_PACKAGE_NAME}@${stats.latestVersion}`;
  const headlessVersionLabel =
    stats.headlessVersion === 'N/A'
      ? HEADLESS_PACKAGE_NAME
      : `${HEADLESS_PACKAGE_NAME}@${stats.headlessVersion}`;
  const modernBuildHighlights = [
    {
      label: 'Luthor footprint',
      detail: `${luthorVersionLabel}: ${stats.luthorPackageSize} unpacked (npm dist metadata).`,
    },
    {
      label: 'Luthor-Headless footprint',
      detail: `${headlessVersionLabel}: ${stats.headlessPackageSize} unpacked (npm dist metadata).`,
    },
    {
      label: 'Combined footprint',
      detail: `${stats.combinedPackageSize} unpacked across both published packages.`,
    },
    {
      label: 'Framework compatibility',
      detail: 'React, Next.js, Astro (via React), Vite, Remix, and similar setups.',
    },
  ] as const;

  return (
    <>
      <HomeJsonLd />

      <section className="section hero-stage">
        <div className="container hero-grid">
          <div className="hero-heading-container">
            <span className="eyebrow">Open Source & MIT Licensed</span>
            <h1 className="hero-title">
              Build Editors That <span className="hero-highlight-title">Refuse</span> To Be Boring
            </h1>
            <p className="hero-copy">
              Luthor is a performant, type-safe and <span className="hero-highlight-text">Lexical Based</span> node package built for modern JS frameworks like <span className="hero-highlight-text">React</span> {' '}
              <span className="hero-highlight-text">Next.js</span> and <span className="hero-highlight-text">Astro</span>. 
            </p>
            <p className="hero-copy">Crafted with ❤️ by developers for developers who want control without chaos. <span className="hero-highlight-text"> Zero fluff. No paywalls. No nonsense.</span>
            </p>
            <p className="hero-live-note">Fully open source. Fully free. Ready for your next project.</p>
            <div className="hero-uses-container">
              {heroUseCases.map((useCase) => (
                <span className="eyebrow-muted" key={useCase.label}>
                  <useCase.icon size={14} weight="duotone" aria-hidden="true" />
                  <span>{useCase.label}</span>
                </span>
              ))}
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

      <section className="section" id="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <p className="section-copy">
            This is where it gets fun, click through to see the full list of features and how they can help you build your next editor experience.
          </p>
          <WhyLuthorFeatures />
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

      <section className="section">
        <div className="container modern-shell">
          <h2 className="section-title">Built On Modern. Built For Modern.</h2>
          <p className="section-copy">
            Current npm package telemetry plus compatibility targets for modern JavaScript applications.
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
                <span>Luthor version</span>
              </p>
              <p className="metric-value">{stats.latestVersion}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">
                <Package size={14} weight="duotone" aria-hidden="true" />
                <span>Luthor package size</span>
              </p>
              <p className="metric-value">{stats.luthorPackageSize}</p>
            </article>
            <article className="metric metric-badge">
              <p className="metric-label">
                <Package size={14} weight="duotone" aria-hidden="true" />
                <span>Headless package size</span>
              </p>
              <p className="metric-value">{stats.headlessPackageSize}</p>
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
            <a className="btn btn-muted" href={LYFIE_NPM_URL} target="_blank" rel="noopener noreferrer">
              <Package className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>Luthor NPM package</span>
            </a>
            <a className="btn btn-muted" href={LYFIE_HEADLESS_NPM_URL} target="_blank" rel="noopener noreferrer">
              <Package className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>Luthor-Headless NPM package</span>
            </a>
            <a className="btn btn-muted" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GithubLogo className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>GitHub</span>
            </a>
            <a className="btn btn-primary" href={SPONSORS_URL} target="_blank" rel="noopener noreferrer">
              <Sparkle className="btn-icon" size={16} weight="duotone" aria-hidden="true" />
              <span>Support the project</span>
            </a>
          </div>
          <p className="mono-small">
            Maintained by{' '}
            <a href={MAINTAINER_ORG_URL} target="_blank" rel="noopener noreferrer">
              {MAINTAINER_ORG_NAME}
            </a>
            . Created by{' '}
            <a href={CREATOR_URL} target="_blank" rel="noopener noreferrer">
              {CREATOR_NAME}
            </a>
            , BDFL of {MAINTAINER_ORG_NAME}.
            | Data sources last sync: <LocalLastSync isoTimestamp={stats.fetchedAtIso} /> 
          </p>    
        </div>
      </section>
             
    </>
  );
}
