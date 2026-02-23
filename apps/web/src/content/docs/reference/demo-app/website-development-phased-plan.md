---
title: "Demo App Website Development Plan"
---

# Demo App Website Development Plan

## Goal

Transform `apps/demo` from a feature showcase into a full product website for `@lyfie/luthor` and `@lyfie/luthor-headless`.

The website must:

- sell the product clearly to developers
- keep the **Extensive Editor** as the first visual focus on load
- promote trust (MIT, free/open-source, stable, type-safe, React compatible, Lexical-based)
- provide a clear path to docs, npm, and GitHub
- keep messaging evidence-backed by repository documentation

## Product Positioning (Messaging Source of Truth)

Use the following anchors for claims and copy:

- MIT + open-source: `LICENSE`, package metadata in `packages/headless/package.json` and `packages/luthor/package.json`
- Lexical foundation and architecture: `README.md`, `documentation/developer/headless/architecture.md`, `documentation/developer/luthor/architecture.md`
- React compatibility: `documentation/user/headless/getting-started.md`, `documentation/user/luthor/getting-started.md`
- Type-safe extension model: `documentation/user/headless/extensions-and-configuration.md`
- Import/export fidelity and persistence: `documentation/user/headless/import-export.md`, `documentation/tutorials/enhanced-markdown-quick-start.md`
- Extensive Editor capabilities: `documentation/user/luthor/extensive-editor.md`

## Implementation Phases

### Phase 1 — Website Foundation in Current Demo App

**Objective**

Ship a marketing-first landing experience in the existing Vite app while preserving the live editor workflow.

**Deliverables**

- top navigation with clear product CTAs
- Extensive Editor centered above the fold
- strong value proposition and trust messaging
- links to docs, npm, GitHub, issues, sponsor/donation
- initial package metrics panel (npm downloads and package metadata)

**Primary Files**

- `apps/demo/src/App.tsx`
- `apps/demo/src/components/DemoTopBar.tsx`
- `apps/demo/src/components/ShowcaseHero.tsx`
- `apps/demo/src/data/demoContent.ts`
- `apps/demo/src/styles/*.css`

**Acceptance Criteria**

- first meaningful paint presents the Extensive Editor as the central wow element
- users can discover both packages in less than one screen scroll
- users can click through to docs/npm/GitHub without searching

---

### Phase 2 — SSG Conversion (Vite + vite-ssg)

**Objective**

Convert app rendering to static generation for route pre-rendering, SEO, and fast initial load.

**Deliverables**

- integrate `vite-react-ssg` (React equivalent of Vite SSG flow)
- static route generation for Home, Demo, Docs, Ecosystem pages
- metadata strategy (titles/descriptions/open graph)
- stable deployment output for static hosting

**Primary Files**

- `apps/demo/package.json`
- `apps/demo/vite.config.ts`
- `apps/demo/src/main.tsx`

**Acceptance Criteria**

- build outputs pre-rendered HTML for route entry points
- all core pages indexable without client runtime dependency

---

### Phase 3 — Website Information Architecture

**Objective**

Split single long page into website-grade routes and conversion flow.

**Routes**

- `/` → marketing landing with editor spotlight
- `/demo` → interactive Extensive Editor playground
- `/docs` → curated docs entry page for user + developer paths
- `/ecosystem` → npm/GitHub/trust/performance snapshot

**Deliverables**

- route-level navigation and section anchors
- consistent layout shell and footer with package links
- CTA ladder: Try Demo → Read Docs → Install → Star/Sponsor

---

### Phase 4 — Curated Docs Experience

**Objective**

Create documentation-facing pages with curated copy that map to canonical markdown docs.

**Deliverables**

- docs index cards by audience (User, Developer, Tutorials)
- “Start here” pathways for both packages
- direct deep-links to existing docs under `documentation/`
- capability matrix for `luthor` vs `luthor-headless`

**Primary Sources**

- `documentation/documentation-hub.md`
- `documentation/index.md`
- `documentation/markdown-catalog.md`
- user/developer docs under `documentation/user/**` and `documentation/developer/**`

---

### Phase 5 — Trust, Security, and Performance Surface

**Objective**

Make reliability and production suitability explicit, with conservative evidence-backed claims.

**Deliverables**

- trust section: MIT, free forever, open source
- compatibility section: React 18/19 and Lexical ecosystem
- safe-by-default section: validation notes from import/export and extension docs
- performance section: conversion behavior and optimization principles from docs

**Claim Rule**

Only ship claims that can be traced to documented behavior or package metadata.

---

### Phase 6 — Data Signals and Ecosystem Intelligence

**Objective**

Show live package momentum and distribution quality indicators.

**Deliverables**

- npm weekly downloads for both packages (client-side fetch)
- latest package version and unpacked size where available
- resilient loading/error/fallback states
- optional trend sparkline in follow-up iteration

**Data Endpoints**

- `https://api.npmjs.org/downloads/point/last-week/@lyfie/luthor`
- `https://api.npmjs.org/downloads/point/last-week/@lyfie/luthor-headless`
- `https://registry.npmjs.org/@lyfie/luthor`
- `https://registry.npmjs.org/@lyfie/luthor-headless`

---

### Phase 7 — Conversion and Production Hardening

**Objective**

Finalize website quality for public launch.

**Deliverables**

- accessibility pass (keyboard/focus/contrast/semantic headings)
- responsive QA pass for mobile/tablet/desktop
- link integrity checks
- Lighthouse budget and basic performance budget
- deploy and rollback runbook in demo maintainer docs

## Content Framework for Website Copy

Use this narrative pattern across hero and sections:

1. **Promise**: Free, open-source, production-ready editor stack.
2. **Proof**: Live Extensive Editor directly on landing.
3. **Choice**: Use plug-and-play `@lyfie/luthor` or fully controlled `@lyfie/luthor-headless`.
4. **Trust**: MIT, React-compatible, Lexical-powered, type-safe extension model.
5. **Action**: Try demo, read docs, install from npm, star/sponsor on GitHub.

## Current Phase Status

- [x] Planning document created
- [x] Phase 1 implementation complete
- [x] Phase 2 implementation complete
- [x] Phase 3 implementation complete
- [x] Phase 4 implementation complete
- [x] Phase 5 implementation complete
- [ ] Phase 6+ rollout
