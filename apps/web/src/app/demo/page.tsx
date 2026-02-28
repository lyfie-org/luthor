import type { Metadata } from 'next';
import { PresetShowcaseShell } from '@/features/editor/preset-showcase-shell';

export const metadata: Metadata = {
  title: 'Luthor Demo Playground',
  description: 'Explore every Luthor preset live, switch instantly, and evaluate the right React + Lexical editing experience before integrating.',
  keywords: ['luthor demo', 'react rich text editor demo', 'lexical editor demo', 'luthor presets'],
  alternates: {
    canonical: '/demo/',
  },
};

export default function DemoPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="demo-hero">
          <p className="eyebrow demo-hero-eyebrow">Live Playground</p>
          <h1 className="hero-title demo-title demo-page-title">
            Build Faster With <span className="hero-highlight-text">Production-Ready</span> Presets
          </h1>
          <p className="section-copy demo-page-copy">
            Compare editing experiences, fine-tune behavior, and ship the setup that matches your product.
          </p>
        </div>
        <PresetShowcaseShell />
      </div>
    </section>
  );
}
