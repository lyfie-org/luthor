'use client';

import {
  ComposeEditor,
  type EditorPreset,
  ExtensiveEditor,
  HeadlessEditorPreset,
  HTMLEditor,
  LegacyRichEditor,
  MarkDownEditor,
  presetRegistry,
  SimpleEditor,
  type SimpleEditorSendPayload,
  SlashEditor,
} from '@lyfie/luthor';
import { PaperPlaneRight } from '@phosphor-icons/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  WEB_DEMO_COMPOSE_CONTENT,
  WEB_DEMO_EXTENSIVE_CONTENT,
  WEB_DEMO_HEADLESS_PRESET_CONTENT,
  WEB_DEMO_HTML_EDITOR_CONTENT,
  WEB_DEMO_LEGACY_RICH_CONTENT,
  WEB_DEMO_MD_EDITOR_CONTENT,
  WEB_DEMO_SIMPLE_EDITOR_CONTENT,
  WEB_DEMO_SLASH_EDITOR_CONTENT,
} from './demo-content';
import { isExternalWebsiteHref } from '@/utils/link';

type Theme = 'light' | 'dark';
const PRISM_THEME_LINK_ID = 'luthor-prism-theme';

const VISIBLE_PRESET_IDS = [
  'extensive',
  'compose',
  'simple-editor',
  'legacy-rich',
  'md-editor',
  'html-editor',
  'slash-editor',
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
  compose: {
    summary: 'Focused rich-text drafting preset with essential formatting and source tabs.',
    useCases: 'Best for support replies, outbound messaging, and professional drafting surfaces.',
    customization: 'Compact toolbar and preset-scoped feature flags can be tuned for product needs.',
    docsPath: '/docs/luthor/presets/compose-editor/',
  },
  'simple-editor': {
    summary: 'Minimal chat/message input with safe formatting and send-oriented behavior.',
    useCases: 'Best for chats, comments, inbox replies, and compact message composers.',
    customization: 'Output format, send interaction, height constraints, and action controls are configurable.',
    docsPath: '/docs/luthor/presets/simple-editor/',
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
  'slash-editor': {
    summary: 'Slash-first authoring mode with draggable blocks and zero toolbar dependence.',
    useCases: 'Best for block-based editors, keyboard-first authoring, and lightweight command-driven input.',
    customization: 'Slash visibility can be tightly controlled while keeping a curated command set.',
    docsPath: '/docs/luthor/presets/slash-editor/',
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
  compose: '<ComposeEditor />',
  'simple-editor': '<SimpleEditor />',
  'legacy-rich': '<LegacyRichEditor />',
  'md-editor': '<MarkDownEditor />',
  'html-editor': '<HTMLEditor />',
  'slash-editor': '<SlashEditor />',
  'headless-editor': '<HeadlessEditorPreset />',
};

const presetHeading: Record<VisiblePresetId, string> = {
  extensive: 'Extensive Editor Preset',
  compose: 'Compose Editor Preset',
  'simple-editor': 'Simple Editor Preset',
  'legacy-rich': 'Legacy Rich Editor Preset',
  'md-editor': 'MD Editor Preset',
  'html-editor': 'HTML Editor Preset',
  'slash-editor': 'Slash Editor Preset',
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
  onEditorThemeChange: (theme: Theme) => void;
};

type PresetSurfaceProps = {
  children: ReactNode;
};

type DemoMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: number;
};

function resolveTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function nextReply(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'Send a prompt and I will respond here.';
  }

  return `Got it. You said:\n\n${trimmed.slice(0, 120)}${trimmed.length > 120 ? '...' : ''}`;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function syncPrismTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  const href = theme === 'dark' ? '/prismjs/themes/prism-okaidia.css' : '/prismjs/themes/prism.css';
  const existing = document.getElementById(PRISM_THEME_LINK_ID);
  const link = existing instanceof HTMLLinkElement ? existing : document.createElement('link');

  if (!(existing instanceof HTMLLinkElement)) {
    link.id = PRISM_THEME_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
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
  onEditorThemeChange,
}: {
  siteTheme: Theme;
  onEditorThemeChange: (theme: Theme) => void;
}) {
  return (
    <PresetSurface>
      <ExtensiveEditor
        initialTheme={siteTheme}
        onThemeChange={onEditorThemeChange}
        showDefaultContent={false}
        defaultContent={WEB_DEMO_EXTENSIVE_CONTENT}
        toolbarAlignment="center"
        isToolbarPinned
        maxListIndentation={8}
      />
    </PresetSurface>
  );
}

function ComposeExperience({
  siteTheme,
  onEditorThemeChange,
}: {
  siteTheme: Theme;
  onEditorThemeChange: (theme: Theme) => void;
}) {
  return (
    <PresetSurface>
      <ComposeEditor
        defaultContent={WEB_DEMO_COMPOSE_CONTENT}
        initialTheme={siteTheme}
        onThemeChange={onEditorThemeChange}
        showDefaultContent={false}
        compactToolbar
        placeholder="Write your customer follow-up..."
      />
    </PresetSurface>
  );
}

function LegacyRichExperience({
  siteTheme,
  onEditorThemeChange,
}: {
  siteTheme: Theme;
  onEditorThemeChange: (theme: Theme) => void;
}) {
  return (
    <PresetSurface>
      <LegacyRichEditor
        defaultContent={WEB_DEMO_LEGACY_RICH_CONTENT}
        initialTheme={siteTheme}
        onThemeChange={onEditorThemeChange}
        showDefaultContent={false}
        defaultEditorView="markdown"
      />
    </PresetSurface>
  );
}

function MarkDownEditorExperience({
  siteTheme,
  onEditorThemeChange,
}: {
  siteTheme: Theme;
  onEditorThemeChange: (theme: Theme) => void;
}) {
  return (
    <PresetSurface>
      <MarkDownEditor
        defaultContent={WEB_DEMO_MD_EDITOR_CONTENT}
        initialTheme={siteTheme}
        onThemeChange={onEditorThemeChange}
        showDefaultContent={false}
        defaultEditorView="markdown"
      />
    </PresetSurface>
  );
}

function HTMLEditorExperience({
  siteTheme,
  onEditorThemeChange,
}: {
  siteTheme: Theme;
  onEditorThemeChange: (theme: Theme) => void;
}) {
  return (
    <PresetSurface>
      <HTMLEditor
        defaultContent={WEB_DEMO_HTML_EDITOR_CONTENT}
        initialTheme={siteTheme}
        onThemeChange={onEditorThemeChange}
        showDefaultContent={false}
        defaultEditorView="html"
      />
    </PresetSurface>
  );
}

function SlashEditorExperience({ siteTheme }: { siteTheme: Theme }) {
  return (
    <PresetSurface>
      <SlashEditor
        defaultContent={WEB_DEMO_SLASH_EDITOR_CONTENT}
        initialTheme={siteTheme}
        showDefaultContent={false}
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

function SimpleEditorExperience({ siteTheme }: { siteTheme: Theme }) {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'seed-assistant',
      role: 'assistant',
      text: 'Hi, I am luthor. Press Enter to send a message.',
      createdAt: Date.now(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const pendingReplyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pendingReplyTimeoutRef.current !== null) {
        window.clearTimeout(pendingReplyTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = (payload: SimpleEditorSendPayload) => {
    const userText = payload.markdown.trim();
    if (!userText) {
      return;
    }

    const createdAt = Date.now();
    setMessages((prev) => [...prev, { id: `user-${createdAt}`, role: 'user', text: userText, createdAt }]);
    setIsTyping(true);

    if (pendingReplyTimeoutRef.current !== null) {
      window.clearTimeout(pendingReplyTimeoutRef.current);
    }

    pendingReplyTimeoutRef.current = window.setTimeout(() => {
      const replyAt = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${replyAt}`, role: 'assistant', text: nextReply(userText), createdAt: replyAt },
      ]);
      setIsTyping(false);
      pendingReplyTimeoutRef.current = null;
    }, 650);
  };

  return (
    <PresetSurface>
      <div className="demo-chat-shell">
        <div className="demo-chat-history" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={[
                'demo-chat-bubble-row',
                message.role === 'user' ? 'demo-chat-bubble-row-user' : 'demo-chat-bubble-row-assistant',
              ].join(' ')}
            >
              <div className="demo-chat-message">
                <div className={['demo-chat-bubble', message.role === 'user' ? 'is-user' : 'is-assistant'].join(' ')}>
                  <div className="demo-chat-bubble-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => {
                          const nextHref = href ?? '#';
                          if (isExternalWebsiteHref(nextHref)) {
                            return (
                              <a href={nextHref} target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            );
                          }
                          if (nextHref.startsWith('/')) return <Link href={nextHref}>{children}</Link>;
                          return <a href={nextHref}>{children}</a>;
                        },
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="demo-chat-message-meta">
                  <span>{message.role === 'user' ? 'You' : 'luthor'}</span>
                  <span className="demo-chat-meta-separator" aria-hidden="true">
                    |
                  </span>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {isTyping ? (
            <div className="demo-chat-bubble-row demo-chat-bubble-row-assistant">
              <div className="demo-chat-bubble is-assistant demo-chat-bubble-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
        </div>

        <div className="demo-chat-composer">
          <SimpleEditor
            defaultContent={WEB_DEMO_SIMPLE_EDITOR_CONTENT}
            initialTheme={siteTheme}
            showDefaultContent={false}
            placeholder="Type a message and press Enter..."
            onSend={handleSend}
            submitOnEnter
            allowShiftEnter
            clearOnSend
            outputFormat="md"
            minHeight={56}
            maxHeight={160}
            minWidth="100%"
            maxWidth="100%"
            showBottomToolbar={false}
            sendButtonPlacement="right"
            sendButtonContent={<PaperPlaneRight size={18} weight="fill" />}
          />
        </div>
      </div>
    </PresetSurface>
  );
}

function PresetRenderer({ presetId, siteTheme, onEditorThemeChange }: PresetRendererProps) {
  switch (presetId) {
    case 'compose':
      return <ComposeExperience siteTheme={siteTheme} onEditorThemeChange={onEditorThemeChange} />;
    case 'simple-editor':
      return <SimpleEditorExperience siteTheme={siteTheme} />;
    case 'legacy-rich':
      return <LegacyRichExperience siteTheme={siteTheme} onEditorThemeChange={onEditorThemeChange} />;
    case 'md-editor':
      return <MarkDownEditorExperience siteTheme={siteTheme} onEditorThemeChange={onEditorThemeChange} />;
    case 'html-editor':
      return <HTMLEditorExperience siteTheme={siteTheme} onEditorThemeChange={onEditorThemeChange} />;
    case 'slash-editor':
      return <SlashEditorExperience siteTheme={siteTheme} />;
    case 'headless-editor':
      return <HeadlessExperience siteTheme={siteTheme} />;
    case 'extensive':
    default:
      return <ExtensiveExperience siteTheme={siteTheme} onEditorThemeChange={onEditorThemeChange} />;
  }
}

export function PresetShowcaseClient() {
  const [siteTheme, setSiteTheme] = useState<Theme>('light');
  const [activeEditorTheme, setActiveEditorTheme] = useState<Theme>('light');
  const [selectedPresetId, setSelectedPresetId] = useState<VisiblePresetId>('extensive');

  useEffect(() => {
    setActiveEditorTheme(siteTheme);
  }, [selectedPresetId, siteTheme]);

  useEffect(() => {
    syncPrismTheme(activeEditorTheme);
  }, [activeEditorTheme]);

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
            onEditorThemeChange={setActiveEditorTheme}
          />
        </div>
      </div>
    </div>
  );
}
