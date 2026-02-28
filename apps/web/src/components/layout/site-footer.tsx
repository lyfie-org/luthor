import { BookOpenText, Coffee, Cube, GithubLogo, Package, PlayCircle, RocketLaunch } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { GITHUB_URL, NPM_URL, REACT_PLAYGROUND_URL, SPONSORS_URL } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-brand" aria-label="About Luthor">
          <Link className="footer-logo" href="/">
            <Image
              className="footer-logo-image"
              src="/luthor-logo-horizontal.png"
              alt="Luthor"
              width={360}
              height={70}
              sizes="(max-width: 768px) 180px, 220px"
            />
          </Link>
          <p>
            A headless, extensible rich text editor built on Lexical.
            Ship faster with production-ready defaults and TypeScript-first APIs.
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
            <span>GitHub Repository</span>
          </a>
          <a href={NPM_URL} target="_blank" rel="noopener noreferrer">
            <Package size={14} weight="duotone" aria-hidden="true" />
            <span>npm Package</span>
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
        <p>Built with love by developers for developers.</p>
        <div className="footer-bottom-links">
          <Link href="/">Home</Link>
          <Link href="/docs/getting-started/">Docs</Link>
          <Link href="/#features">Features</Link>
          <Link href="/demo/">Demo</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub Repo
          </a>
          <a href="/llms.txt">llms.txt</a>
          <a href="/llms-full.txt">llms-full.txt</a>
        </div>
      </div>
    </footer>
  );
}
