/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import {
  type EditorPreset,
  ExtensiveEditor,
  HeadlessEditorPreset,
  HTMLEditor,
  LegacyRichEditor,
  MarkDownEditor,
  presetRegistry,
} from '@lyfie/luthor';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  WEB_DEMO_EXTENSIVE_CONTENT,
  WEB_DEMO_HEADLESS_PRESET_CONTENT,
  WEB_DEMO_HTML_EDITOR_CONTENT,
  WEB_DEMO_LEGACY_RICH_CONTENT,
  WEB_DEMO_MD_EDITOR_CONTENT,
} from './demo-content';

type Theme = 'light' | 'dark';

const VISIBLE_PRESET_IDS = [
  'extensive',
  'legacy-rich',
  'md-editor',
  'html-editor',
  'headless-editor',
] as const;

type VisiblePresetId = (typeof VISIBLE_PRESET_IDS)[number];

const presetEntries = VISIBLE_PRESET_IDS.map((id) => presetRegistry[id]).filter(
  (preset): preset is EditorPreset => Boolean(preset),
);

const fallbackPreset: { id: VisiblePresetId; label: string } = { id: 'extensive', label: 'Extensive Editor' };

type PresetDetails = {
  summary: string;
  useCases: string;
  customization: string;
  docsPath: string;
};

const presetDetails: Record<VisiblePresetId, PresetDetails> = {
  extensive: {
    summary: 'Complete WYSIWYG surface for long-form writing, docs, and knowledge workflows.',
    useCases: 'Best for CMS pages, technical docs, internal knowledge bases, and full editing suites.',
    customization: 'Theme tokens, toolbar controls, source tabs, slash visibility, and feature flags are all configurable.',
    docsPath: '/docs/luthor/presets/extensive-editor/',
  },
  'legacy-rich': {
    summary: 'Metadata-free native profile that powers both MD and HTML focused editors.',
    useCases: 'Best for compatibility-first products that need clean markdown/html round trips.',
    customization: 'Switch source format between markdown and html while keeping the same native feature set.',
    docsPath: '/docs/luthor/presets/legacy-rich-editor/',
  },
  'md-editor': {
    summary: 'LegacyRich markdown profile with native markdown-compatible formatting and clean source round-trips.',
    useCases: 'Best for developer docs, markdown knowledge bases, and migration-safe text workflows.',
    customization: 'Uses LegacyRichEditor under the hood with markdown source mode defaults.',
    docsPath: '/docs/luthor/presets/md-editor/',
  },
  'html-editor': {
    summary: 'LegacyRich html profile with metadata-free html-compatible formatting and source control.',
    useCases: 'Best for html templates, static-page editors, and systems requiring html round-trips.',
    customization: 'Uses LegacyRichEditor under the hood with html source mode defaults.',
    docsPath: '/docs/luthor/presets/html-editor/',
  },
  'headless-editor': {
    summary: 'Basic rich-text preset with simple controls and full source tabs for lightweight authoring.',
    useCases: 'Best for starter editors, internal tools, and simple text workflows with clean output.',
    customization: 'Focused feature profile keeps only essential formatting and structure controls enabled.',
    docsPath: '/docs/luthor/presets/headless-editor-preset/',
  },
};

const presetTag: Record<VisiblePresetId, string> = {
  extensive: '<ExtensiveEditor />',
  'legacy-rich': '<LegacyRichEditor />',
  'md-editor': '<MarkDownEditor />',
  'html-editor': '<HTMLEditor />',
  'headless-editor': '<HeadlessEditorPreset />',
};

const presetHeading: Record<VisiblePresetId, string> = {
  extensive: 'Extensive Editor Preset',
  'legacy-rich': 'Legacy Rich Editor Preset',
  'md-editor': 'MD Editor Preset',
  'html-editor': 'HTML Editor Preset',
  'headless-editor': 'Headless Editor Preset',
};

const defaultPresetDetails: PresetDetails = {
  summary: 'Full-feature rich text editor preset with formatting, embeds, tables, and source workflows.',
  useCases: 'Best for docs editors, CMS authoring, and internal tools needing complete WYSIWYG controls.',
  customization: 'Tune feature flags, toolbar alignment, theme tokens, and mode defaults.',
  docsPath: '/docs/luthor/presets/extensive-editor/',
};

type PresetRendererProps = {
  presetId: VisiblePresetId;
  siteTheme: Theme;
};

type PresetSurfaceProps = {
  children: ReactNode;
};

function resolveTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function PresetSurface({ children }: PresetSurfaceProps) {
  return (
    <section className="demo-preset-surface-body">
      <div>{children}</div>
    </section>
  );
}

function ExtensiveExperience({
  siteTheme,
}: {
  siteTheme: Theme;
}) {
  return (
    <PresetSurface>
      <ExtensiveEditor
        initialTheme={siteTheme}
        showDefaultContent={false}
        defaultContent={WEB_DEMO_EXTENSIVE_CONTENT}
        toolbarAlignment="center"
        isToolbarPinned
        maxListIndentation={8}
      />
    </PresetSurface>
  );
}

function LegacyRichExperience({
  siteTheme,
}: {
  siteTheme: Theme;
}) {
  return (
    <PresetSurface>
      <LegacyRichEditor
        defaultContent={WEB_DEMO_LEGACY_RICH_CONTENT}
        initialTheme={siteTheme}
        showDefaultContent={false}
        defaultEditorView="markdown"
      />
    </PresetSurface>
  );
}

function MarkDownEditorExperience({
  siteTheme,
}: {
  siteTheme: Theme;
}) {
  return (
    <PresetSurface>
      <MarkDownEditor
        defaultContent={WEB_DEMO_MD_EDITOR_CONTENT}
        initialTheme={siteTheme}
        showDefaultContent={false}
        defaultEditorView="markdown"
      />
    </PresetSurface>
  );
}

function HTMLEditorExperience({
  siteTheme,
}: {
  siteTheme: Theme;
}) {
  return (
    <PresetSurface>
      <HTMLEditor
        defaultContent={WEB_DEMO_HTML_EDITOR_CONTENT}
        initialTheme={siteTheme}
        showDefaultContent={false}
        defaultEditorView="html"
      />
    </PresetSurface>
  );
}

function HeadlessExperience({ siteTheme }: { siteTheme: Theme }) {
  return (
    <PresetSurface>
      <HeadlessEditorPreset
        defaultContent={WEB_DEMO_HEADLESS_PRESET_CONTENT}
        initialTheme={siteTheme}
        showDefaultContent={false}
        defaultEditorView="visual"
      />
    </PresetSurface>
  );
}

function PresetRenderer({ presetId, siteTheme }: PresetRendererProps) {
  switch (presetId) {
    case 'legacy-rich':
      return <LegacyRichExperience siteTheme={siteTheme} />;
    case 'md-editor':
      return <MarkDownEditorExperience siteTheme={siteTheme} />;
    case 'html-editor':
      return <HTMLEditorExperience siteTheme={siteTheme} />;
    case 'headless-editor':
      return <HeadlessExperience siteTheme={siteTheme} />;
    case 'extensive':
    default:
      return <ExtensiveExperience siteTheme={siteTheme} />;
  }
}

export function PresetShowcaseClient() {
  const [siteTheme, setSiteTheme] = useState<Theme>('light');
  const [selectedPresetId, setSelectedPresetId] = useState<VisiblePresetId>('extensive');

  useEffect(() => {
    setSiteTheme(resolveTheme());

    const observer = new MutationObserver(() => {
      setSiteTheme(resolveTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const activePreset = useMemo(() => {
    return presetEntries.find((preset) => preset.id === selectedPresetId) ?? fallbackPreset;
  }, [selectedPresetId]);
  const activePresetDetails = presetDetails[selectedPresetId] ?? defaultPresetDetails;

  return (
    <div className="demo-showcase-layout">
      <aside className="demo-preset-sidebar" aria-label="Preset navigation">
        <h2>Presets</h2>
        <p className="demo-preset-sidebar-copy">Choose a preset and inspect a real-world style treatment.</p>
        <nav>
          {presetEntries.map((preset) => {
            const isActive = preset.id === activePreset.id;

            return (
              <button
                key={preset.id}
                type="button"
                className={['demo-preset-nav-item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => setSelectedPresetId(preset.id as VisiblePresetId)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span>{preset.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="demo-showcase-main">
        <article className="demo-preset-writeup">
          <div className="demo-preset-title-row">
            <h3>{presetHeading[selectedPresetId] ?? `${activePreset.label} Preset`}</h3>
            <code className="demo-preset-inline-code">{presetTag[selectedPresetId] ?? '<Editor />'}</code>
          </div>
          <p>{activePresetDetails.summary}</p>
          <p>
            <strong>Use cases:</strong> {activePresetDetails.useCases}
          </p>
          <p>
            <strong>Customization:</strong> {activePresetDetails.customization}
          </p>
          <Link href={activePresetDetails.docsPath} className="demo-preset-docs-link">
            View preset docs
          </Link>
        </article>
        <div className="browser-frame demo-showcase-frame">
          <div className="browser-frame-header">
            <div className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <PresetRenderer
            key={`${selectedPresetId}-${siteTheme}`}
            presetId={selectedPresetId}
            siteTheme={siteTheme}
          />
        </div>
      </div>
    </div>
  );
}
