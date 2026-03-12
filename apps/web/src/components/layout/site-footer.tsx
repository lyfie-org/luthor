import { BookOpenText, Coffee, Cube, GithubLogo, Package, PlayCircle, RocketLaunch } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {
  CREATOR_NAME,
  CREATOR_URL,
  GITHUB_URL,
  MAINTAINER_ORG_NAME,
  MAINTAINER_ORG_URL,
  LYFIE_HEADLESS_NPM_URL,
  LYFIE_NPM_URL,
  REACT_PLAYGROUND_URL,
  SPONSORS_URL,
} from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-brand" aria-label="About Luthor">
          <Link className="footer-logo" href="/" aria-label="Luthor">
            <span className="footer-logo-image theme-logo-horizontal" aria-hidden="true" />
          </Link>
          <p>
            An extensible rich text editor framework built on Lexical.
            Ship faster with production-ready defaults and TypeScript-first APIs.
            {' '}
          </p>
        </section>

        <section className="footer-column" aria-label="Documentation">
          <h3>Documentation</h3>
          <Link href="/docs/getting-started/">
            <RocketLaunch size={14} weight="duotone" aria-hidden="true" />
            <span>Introduction</span>
          </Link>
          <Link href="/docs/getting-started/installation/">
            <Package size={14} weight="duotone" aria-hidden="true" />
            <span>Installation</span>
          </Link>
          <Link href="/docs/luthor-headless/features/">
            <Cube size={14} weight="duotone" aria-hidden="true" />
            <span>@lyfie/luthor-headless</span>
          </Link>
          <Link href="/docs/luthor/presets/">
            <BookOpenText size={14} weight="duotone" aria-hidden="true" />
            <span>@lyfie/luthor</span>
          </Link>
        </section>

        <section className="footer-column" aria-label="Resources">
          <h3>Resources</h3>
          <Link href="/demo/">
            <PlayCircle size={14} weight="duotone" aria-hidden="true" />
            <span>Demo</span>
          </Link>
          <Link href="/#features">
            <PlayCircle size={14} weight="duotone" aria-hidden="true" />
            <span>Features</span>
          </Link>
          <a href={REACT_PLAYGROUND_URL} target="_blank" rel="noopener noreferrer">
            <PlayCircle size={14} weight="duotone" aria-hidden="true" />
            <span>Playground</span>
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <GithubLogo size={14} weight="duotone" aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <a href={LYFIE_NPM_URL} target="_blank" rel="noopener noreferrer">
            <Package size={14} weight="duotone" aria-hidden="true" />
            <span>luthor @ npm</span>
          </a>
          <a href={LYFIE_HEADLESS_NPM_URL} target="_blank" rel="noopener noreferrer">
            <Package size={14} weight="duotone" aria-hidden="true" />
            <span>luthor-headless @ npm</span>
          </a>
        </section>

        <section className="footer-column footer-support" aria-label="Support Luthor">
          <h3>Support the Project</h3>
          <a className="footer-cta footer-cta-primary" href={SPONSORS_URL} target="_blank" rel="noopener noreferrer">
            <Coffee size={16} weight="duotone" aria-hidden="true" />
            <span>Buy me a coffee</span>
          </a>
          <a className="footer-cta footer-cta-secondary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <GithubLogo size={16} weight="duotone" aria-hidden="true" />
            <span>Star on GitHub</span>
          </a>
        </section>
      </div>

      <div className="container footer-bottom">
        <p>Built with ❤️ by <a href={MAINTAINER_ORG_URL}>{MAINTAINER_ORG_NAME}</a>
        </p>
        <div className="footer-bottom-links">
          <Link href="/">Home</Link>
          <Link href="/docs/getting-started/">Docs</Link>
          <Link href="/#features">Features</Link>
          <Link href="/demo/">Demo</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="/llms.txt">llms.txt</a>
          <a href="/llms-full.txt">llms-full.txt</a>
        </div>
      </div>
    </footer>
  );
}
