---
title: AI Agents and Vibe Coding
description: How to use llms.txt and llms-full.txt with AI coding agents so the agent can answer and implement accurately.
---

# AI Agents and Vibe Coding

If you use AI coding agents, this page is for you.

Luthor publishes two docs artifacts specifically for agent context:

- `/llms.txt`: lightweight index and structured docs map.
- `/llms-full.txt`: full markdown corpus from all docs pages.

## Which file should I load?

- Use `/llms.txt` when your agent already has repository access and you only need quick docs discovery.
- Use `/llms-full.txt` when you want the agent to answer package questions directly from one file.
- If token budget allows, load both.

## Recommended workflow

1. Load `llms-full.txt` into your AI agent context.
2. Ask for a task using exact API names, for example:
   - "Create an `ExtensiveEditor` setup with custom `headingOptions` and disabled `image`."
   - "Build a headless editor with `createEditorSystem` and a minimal toolbar."
3. Ask the agent to point to exact props/methods before coding.
4. Ask the agent to generate code and tests using those exact APIs.
5. Validate by running your app and package tests.

## Prompt templates you can reuse

### Understand before coding

```txt
I loaded Luthor docs in context. Summarize the exact props, defaults, and feature flags needed for this use case:
<your use case>
Then give me a short implementation plan.
```

### Build with exact API usage

```txt
Use only documented Luthor APIs from context.
Implement <your task> in my codebase.
Do not invent props or commands.
After changes, list every prop/method you used and why.
```

### Refactor safely

```txt
Refactor this editor setup to <target behavior> while preserving output compatibility (JSON/Markdown/HTML).
Show before/after behavior for mode switching and feature flags.
```

## Vibe coding without losing correctness

- Keep prompts concrete: mention preset, mode, feature flags, and output format.
- Ask for command names explicitly (`toggleBold`, `insertTable`, `setSlashCommands`, and so on).
- Ask for fallback behavior (`initialMode`, `defaultEditorView`, source conversion errors).
- Ask the agent to verify unsupported combinations before coding.

## Practical examples

- "Build a `SimpleEditor` chat input with `submitOnEnter` and right-side send button."
- "Create a `SlashEditor` configuration that only allows heading/list/code block commands."
- "Configure `ExtensiveEditor` syntax highlighting with default/custom/disabled modes."
- "Use `HeadlessEditorPreset` and save JSON/Markdown/HTML snapshots from ref methods."

## Keep docs and code in sync

When you change behavior:

1. Update docs in `apps/web/src/content/docs/**`.
2. Run `pnpm -C apps/web run sync:docs`.
3. Run `pnpm -C apps/web run sync:llms`.

This keeps agent context aligned with runtime behavior.
