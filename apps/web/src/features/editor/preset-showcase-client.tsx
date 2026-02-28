'use client';

import {
  type ChatWindowEditorSendPayload,
  ChatWindowEditor,
  type EditorPreset,
  ExtensiveEditor,
  presetRegistry,
} from '@lyfie/luthor';
import { PaperPlaneRight } from '@phosphor-icons/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useMemo, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

const VISIBLE_PRESET_IDS = ['extensive', 'chat-window'] as const;
const presetEntries = VISIBLE_PRESET_IDS.map((id) => presetRegistry[id]).filter(
  (preset): preset is EditorPreset => Boolean(preset),
);
const fallbackPreset = { id: 'extensive', label: 'Extensive' };
type PresetDetails = {
  summary: string;
  useCases: string;
  customization: string;
  docsPath: string;
};

const presetDetails: Record<string, PresetDetails> = {
  extensive: {
    summary: 'Full-feature rich text editor preset with formatting, embeds, tables, and markdown/source workflows.',
    useCases: 'Best for docs editors, CMS authoring, internal tools, and any product needing complete WYSIWYG controls.',
    customization: 'Tune feature flags, toolbar alignment, theme tokens, mode defaults, and extension-level behavior.',
    docsPath: '/docs/luthor/presets/extensive-editor/',
  },
  'chat-window': {
    summary: 'Constrained chat composer preset for message input with chat-friendly formatting defaults.',
    useCases: 'Best for assistant chats, support inboxes, and conversational UIs where Enter-to-send is expected.',
    customization: 'Control send behavior, toolbar actions, formatting options, size limits, and output format.',
    docsPath: '/docs/luthor/presets/chat-window-editor/',
  },
};

const presetTag: Record<string, string> = {
  extensive: '<ExtensiveEditor />',
  'chat-window': '<ChatWindowEditor />',
};
const presetHeading: Record<string, string> = {
  extensive: 'Extensive Preset',
  'chat-window': 'Chat Window Preset',
};
const defaultPresetDetails: PresetDetails = {
  summary: 'Full-feature rich text editor preset with formatting, embeds, tables, and markdown/source workflows.',
  useCases: 'Best for docs editors, CMS authoring, internal tools, and any product needing complete WYSIWYG controls.',
  customization: 'Tune feature flags, toolbar alignment, theme tokens, mode defaults, and extension-level behavior.',
  docsPath: '/docs/luthor/presets/extensive-editor/',
};

function resolveTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

type PresetRendererProps = {
  presetId: string;
  siteTheme: Theme;
};

type DemoMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: number;
};

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

function ChatWindowExperience({ siteTheme }: { siteTheme: Theme }) {
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

  const handleSend = (payload: ChatWindowEditorSendPayload) => {
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
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
        <ChatWindowEditor
          initialTheme={siteTheme}
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
  );
}

function PresetRenderer({ presetId, siteTheme }: PresetRendererProps) {
  switch (presetId) {
    case 'chat-window':
      return <ChatWindowExperience siteTheme={siteTheme} />;
    case 'extensive':
    default:
      return <ExtensiveEditor initialTheme={siteTheme} showDefaultContent toolbarAlignment="center" />;
  }
}

export function PresetShowcaseClient() {
  const [siteTheme, setSiteTheme] = useState<Theme>('light');
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    return presetEntries.find((preset) => preset.id === 'extensive')?.id ?? presetEntries[0]?.id ?? 'extensive';
  });

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
    return presetEntries.find((preset) => preset.id === selectedPresetId) ?? presetEntries[0] ?? fallbackPreset;
  }, [selectedPresetId]);
  const activePresetDetails = presetDetails[activePreset.id] ?? defaultPresetDetails;

  return (
    <div className="demo-showcase-layout">
      <aside className="demo-preset-sidebar" aria-label="Preset navigation">
        <h2>Presets</h2>
        <p className="demo-preset-sidebar-copy">Choose a preset.</p>
        <nav>
          {presetEntries.map((preset) => {
            const isActive = preset.id === activePreset.id;

            return (
              <button
                key={preset.id}
                type="button"
                className={['demo-preset-nav-item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => setSelectedPresetId(preset.id)}
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
            <h3>{presetHeading[activePreset.id] ?? `${activePreset.label} Preset`}</h3>
            <code className="demo-preset-inline-code">{presetTag[activePreset.id] ?? '<Editor />'}</code>
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
          <div className="editor-pane demo-showcase-editor-pane">
            <PresetRenderer key={`${activePreset.id}-${siteTheme}`} presetId={activePreset.id} siteTheme={siteTheme} />
          </div>
        </div>
      </div>
    </div>
  );
}
