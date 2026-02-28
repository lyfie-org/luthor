'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import {
  ArrowsOutCardinal,
  BracketsCurly,
  CheckCircle,
  Code,
  Command,
  CursorText,
  Highlighter,
  Image as ImageIcon,
  Keyboard,
  LinkSimple,
  ListBullets,
  MoonStars,
  Quotes,
  TextAa,
  TextAlignLeft,
  TextIndent,
  TextT,
  TextUnderline,
  X,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';

type WhyFeature = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  bullets: string[];
  icon: Icon;
  detailIcon: Icon;
  mediaAlt: string;
  mediaSrc: string;
};

const FEATURE_PREVIEW_IMAGE = '/social-card.svg';
const featureGif = (index: number) => `/features/Feature${index}.gif`;

const WHY_FEATURES: WhyFeature[] = [
  {
    id: 'typography',
    title: 'Typography Controls',
    summary: 'Custom fonts, font size controls, and line-height that behaves.',
    detail: 'Typography should fit your product voice, not force browser defaults.',
    icon: TextAa,
    detailIcon: TextT,
    bullets: [
      'Use any custom font you want.',
      'Dial in font sizes for readability.',
      'Granular line-height control for cleaner rhythm.',
    ],
    mediaAlt: 'Typography controls preview',
    mediaSrc: featureGif(1),
  },
  {
    id: 'essentials',
    title: 'Essentials Done Right',
    summary: 'Bold, italic, underline, strike, sub/superscript, code, and quotes.',
    detail: 'Core formatting is implemented cleanly and type-safe.',
    icon: TextUnderline,
    detailIcon: CursorText,
    bullets: [
      'Bold, italic, underline, and strikethrough.',
      'Subscript and superscript support.',
      'Inline code and block quotes.',
    ],
    mediaAlt: 'Text formatting essentials preview',
    mediaSrc: featureGif(2),
  },
  {
    id: 'colors',
    title: 'Color And Highlight',
    summary: 'Apply font color and highlights without inline style chaos.',
    detail: 'Color tools integrate with themes and keep output clean.',
    icon: Highlighter,
    detailIcon: TextT,
    bullets: [
      'Font color support.',
      'Highlight support.',
      'Theme-friendly output styles.',
    ],
    mediaAlt: 'Color and highlight preview',
    mediaSrc: featureGif(3),
  },
  {
    id: 'links-structure',
    title: 'Links And Structure',
    summary: 'Predictable links plus semantic headings and paragraph flow.',
    detail: 'Link insertion is clean, and document hierarchy stays sane.',
    icon: LinkSimple,
    detailIcon: TextAlignLeft,
    bullets: [
      'Predictable link insertion behavior.',
      'Paragraphs and headings from H1 to H6.',
      'Left, center, right, and justify alignment.',
    ],
    mediaAlt: 'Links and structure preview',
    mediaSrc: featureGif(4),
  },
  {
    id: 'lists',
    title: "Lists That Know What They're Doing",
    summary: 'Unordered, ordered, and checklist/task lists in one workflow.',
    detail: 'Use the right list type without fighting editor state.',
    icon: ListBullets,
    detailIcon: CheckCircle,
    bullets: [
      'Unordered lists for free-form notes.',
      'Ordered lists for sequences and steps.',
      'Checklist/task lists for actionable content.',
    ],
    mediaAlt: 'Lists preview',
    mediaSrc: featureGif(5),
  },
  {
    id: 'indentation',
    title: 'Indentation Control',
    summary: 'Indent in and out with consistent, structure-safe behavior.',
    detail: 'Tab behavior is predictable and respects document structure.',
    icon: TextIndent,
    detailIcon: ArrowsOutCardinal,
    bullets: [
      'Tab in and tab out quickly.',
      'Supports structured indentation behavior.',
      'Works cleanly with nested content.',
    ],
    mediaAlt: 'Indentation preview',
    mediaSrc: featureGif(6),
  },
  {
    id: 'embeds',
    title: 'Rich Embeds',
    summary: 'Embed images, iframes, and YouTube content with minimal friction.',
    detail: 'Paste and render rich media without bolt-on hacks.',
    icon: ImageIcon,
    detailIcon: ImageIcon,
    bullets: [
      'Image embedding support.',
      'Iframe embedding support.',
      'YouTube embed flow.',
    ],
    mediaAlt: 'Rich embed preview',
    mediaSrc: featureGif(7),
  },
  {
    id: 'code',
    title: 'Code Blocks',
    summary: 'Syntax-ready code blocks for docs, tutorials, and snippets.',
    detail: 'Code content stays structured and extendable for real product usage.',
    icon: Code,
    detailIcon: BracketsCurly,
    bullets: [
      'Dedicated code block support.',
      'Built for developer-focused content.',
      'Extensible for richer syntax experiences.',
    ],
    mediaAlt: 'Code block preview',
    mediaSrc: featureGif(8),
  },
  {
    id: 'theme',
    title: 'Dark/Light Ready',
    summary: 'Editor-layer theme support, not fragile visual hacks.',
    detail: 'Dark and light mode behavior is built in from the editor layer.',
    icon: MoonStars,
    detailIcon: MoonStars,
    bullets: [
      'Theme switching support.',
      'Consistent readability across themes.',
      'Works with your app-level styling model.',
    ],
    mediaAlt: 'Theme switching preview',
    mediaSrc: featureGif(9),
  },
  {
    id: 'history-shortcuts',
    title: 'History + Shortcuts',
    summary: 'Undo/redo and keyboard-first interactions across core features.',
    detail: 'Move fast without relying on toolbar clicks.',
    icon: Keyboard,
    detailIcon: Keyboard,
    bullets: [
      'Full undo and redo history.',
      'Keyboard-friendly command flow.',
      'Built for power-user editing speed.',
    ],
    mediaAlt: 'Undo, redo, and shortcuts preview',
    mediaSrc: featureGif(10),
  },
  {
    id: 'slash',
    title: 'Slash Command Center',
    summary: 'Type `/` to discover and trigger editor actions quickly.',
    detail: 'Slash commands are fast, predictable, and easy to extend.',
    icon: Command,
    detailIcon: Command,
    bullets: [
      'Type `/` to reveal actions.',
      'Predictable command discovery.',
      'Extensible command architecture.',
    ],
    mediaAlt: 'Slash command preview',
    mediaSrc: featureGif(11),
  },
  {
    id: 'custom-blocks',
    title: 'Custom Blocks',
    summary: 'Create custom nodes and schema extensions for product-specific UX.',
    detail: 'If defaults are not enough, the editor can be shaped around your needs.',
    icon: BracketsCurly,
    detailIcon: Quotes,
    bullets: [
      'Create custom nodes.',
      'Inject product-specific blocks.',
      'Extend schema behavior safely.',
    ],
    mediaAlt: 'Custom block preview',
    mediaSrc: featureGif(12),
  },
];

export function WhyLuthorFeatures() {
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [missingMediaIds, setMissingMediaIds] = useState<Record<string, true>>({});

  const activeFeature = useMemo(
    () => WHY_FEATURES.find((feature) => feature.id === activeFeatureId) ?? null,
    [activeFeatureId],
  );

  useEffect(() => {
    if (!activeFeatureId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFeatureId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeFeatureId]);

  return (
    <>
      <div className="why-feature-grid">
        {WHY_FEATURES.map((feature) => (
          <button
            key={feature.id}
            type="button"
            className="why-feature-card"
            onClick={() => setActiveFeatureId(feature.id)}
            aria-haspopup="dialog"
          >
            <div className='why-feature-header'>
              <h3>{feature.title}</h3>
              <div className="why-feature-card-icon">
                <feature.icon size={18} weight="duotone" aria-hidden="true" />
              </div>              
            </div>            
            <p>{feature.summary}</p>
            <span className="why-feature-cta">
              <span>View details</span>
            </span>
          </button>
        ))}
      </div>

      {activeFeature ? (
        <div
          className="why-feature-modal-backdrop"
          role="presentation"
          onClick={() => setActiveFeatureId(null)}
        >
          <div
            className="why-feature-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`why-feature-title-${activeFeature.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="why-feature-modal-close"
              onClick={() => setActiveFeatureId(null)}
              aria-label="Close details dialog"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
            <div className="why-feature-media-shell">
              <NextImage
                src={missingMediaIds[activeFeature.id] ? FEATURE_PREVIEW_IMAGE : activeFeature.mediaSrc}
                alt={activeFeature.mediaAlt}
                className="why-feature-media"
                width={1200}
                height={630}
                sizes="(max-width: 768px) 92vw, 720px"
                onError={() =>
                  setMissingMediaIds((current) => (current[activeFeature.id] ? current : { ...current, [activeFeature.id]: true }))
                }
              />
            </div>
            <h3 id={`why-feature-title-${activeFeature.id}`} className="why-feature-modal-title">
              <activeFeature.icon size={18} weight="duotone" aria-hidden="true" />
              <span>{activeFeature.title}</span>
            </h3>
            <p>{activeFeature.detail}</p>
            <ul className="why-feature-detail-list">
              {activeFeature.bullets.map((bullet) => (
                <li key={bullet}>
                  <activeFeature.detailIcon size={14} weight="duotone" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

