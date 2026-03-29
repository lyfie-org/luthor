/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export default function GlobalLoading() {
  return (
    <section className="section loading-section" aria-live="polite" aria-busy="true">
      <div className="container loading-shell">
        <div className="loading-card">
          <div className="loading-pulse loading-line-lg" />
          <div className="loading-pulse loading-line-md" />
          <div className="loading-pulse loading-line-sm" />
        </div>
      </div>
    </section>
  );
}

