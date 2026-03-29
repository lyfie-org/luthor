/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  Atom,
  BracketsCurly,
  Command,
  Cpu,
  Database,
  GearSix,
  Lightning,
  RocketLaunch,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';

type WhyReason = {
  title: string;
  description: string;
  icon: Icon;
};

const WHY_REASONS: WhyReason[] = [
  {
    title: 'Lightning Performance',
    description: 'Fast typing, stable selection handling, and responsive editor interactions.',
    icon: Lightning,
  },
  {
    title: 'Type-Safe Commands',
    description: 'Command APIs are typed so behavior stays predictable as your codebase grows.',
    icon: Command,
  },
  {
    title: 'Extensible',
    description: 'Add nodes, commands, and product-specific behavior without fighting the editor core.',
    icon: GearSix,
  },
  {
    title: 'React-First Design',
    description: 'Built to fit naturally into modern React apps and component workflows.',
    icon: Atom,
  },
  {
    title: 'Production Ready',
    description: 'Designed for real shipping use-cases, not demo-only editor surfaces.',
    icon: RocketLaunch,
  },
  {
    title: 'Developer Experience',
    description: 'Clear APIs and practical defaults help teams move faster with less friction.',
    icon: Cpu,
  },
  {
    title: 'TypeScript Support Integrated',
    description: 'Strong TypeScript support is built in across editor primitives and utilities.',
    icon: BracketsCurly,
  },
  {
    title: 'JSON Data Read',
    description: 'Structured editor state can be consumed and processed cleanly as JSON data.',
    icon: Database,
  },
];

export function WhyLuthorReasons() {
  return (
    <div className="why-reason-grid">
      {WHY_REASONS.map((reason) => (
        <article className="why-reason-card" key={reason.title}>
          <div className="why-reason-title-row">
            <div className="why-reason-icon">
              <reason.icon size={18} weight="duotone" aria-hidden="true" />
            </div>
            <h3>{reason.title}</h3>
          </div>
          <p>{reason.description}</p>
        </article>
      ))}
    </div>
  );
}
