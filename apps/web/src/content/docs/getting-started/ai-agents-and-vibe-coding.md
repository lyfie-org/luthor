---
title: "AI Agents and Vibe Coding"
description: "Use llms.txt and llms-full.txt with strict API-grounded prompts and verification workflow."
package: "shared"
docType: "guide"
surface: "tooling"
keywords:
  - "llms.txt"
  - "llms-full.txt"
  - "ai agent workflow"
  - "prompting"
props:
  []
exports:
  []
commands:
  - "insert.table"
  - "format.bold"
extensions:
  - "codeIntelligenceExtension"
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "apps/web/scripts/generate-llms.mjs"
navGroup: "start_here"
navOrder: 70
---

# AI Agents and Vibe Coding

This page keeps agent-assisted implementation accurate.

## What this page answers

- Which docs artifact should an agent load?
- How do I force exact API usage?

## Artifact choice

- Use `/llms.txt` for fast discovery and route mapping.
- Use `/llms-full.txt` for full corpus context in one file.

## Prompt contract

1. Ask for exact APIs first (props, command IDs, extension exports).
2. Ask for implementation only after the API list is confirmed.
3. Ask for validation steps (lint, tests, and runtime checks).


