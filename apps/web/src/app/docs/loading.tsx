/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export default function DocsLoading() {
  return (
    <section className="section docs-section" aria-live="polite" aria-busy="true">
      <div className="container">
        <div className="docs-layout">
          <aside className="docs-sidebar">
            <div className="loading-pulse loading-line-md" />
            <div className="loading-pulse loading-line-sm" />
            <div className="loading-pulse loading-line-sm" />
            <div className="loading-pulse loading-line-sm" />
          </aside>
          <div className="docs-main">
            <div className="docs-search">
              <div className="loading-pulse loading-line-sm" />
            </div>
            <article className="docs-article">
              <div className="loading-pulse loading-line-lg" />
              <div className="loading-pulse loading-line-md" />
              <div className="loading-pulse loading-line-md" />
              <div className="loading-pulse loading-line-sm" />
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

