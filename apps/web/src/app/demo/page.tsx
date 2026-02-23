import type { Metadata } from 'next';
import { ExtensiveEditorShell } from '@/features/editor/extensive-editor-shell';

export const metadata: Metadata = {
  title: 'Luthor Demo Playground',
  description: 'Try the Luthor Extensive Editor preset live and evaluate React + Lexical rich text editing before integrating.',
  keywords: ['luthor demo', 'react rich text editor demo', 'lexical editor demo'],
  alternates: {
    canonical: '/demo/',
  },
};

export default function DemoPage() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="hero-title demo-title">Demo playground</h1>
        <p className="section-copy">Zero-config Extensive Editor: go from install to full rich text in under a minute.</p>

        <div className="browser-frame">
          <div className="browser-frame-header">
            <div className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <code className="install-chip">@lyfie/luthor extensive preset</code>
          </div>
          <div className="editor-pane">
            <ExtensiveEditorShell />
          </div>
        </div>
      </div>
    </section>
  );
}
