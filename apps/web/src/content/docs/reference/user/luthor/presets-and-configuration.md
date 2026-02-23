---
title: "`@lyfie/luthor` Presets and Configuration"
---

# `@lyfie/luthor` Presets and Configuration

This document describes what can be configured as a package user when using built-in presets.

## Built-in preset registry

The package exports a preset registry and the extensive preset:

- `presetRegistry`
- `extensivePreset`
- `ExtensiveEditor`
- `extensiveExtensions`

## Preset metadata model

`EditorPreset` supports these fields:

- `id`, `label`, `description`
- `toolbar`: ordered toolbar action ids
- `extensions`: extension set used by the preset
- `config`: editor config (namespace, placeholder, classNames)
- `theme`: preset theme object
- `components`: editor shell components
- `css`: style entry path

## Extensive preset defaults

The extensive preset is the full-feature default and includes:

- comprehensive toolbar actions
- command palette + slash command system
- media and embeds (image, iframe, YouTube)
- source mode switching and JSONB conversion helpers

## `ExtensiveEditor` commonly used props

- `placeholder`
- `initialTheme`
- `defaultContent`
- `showDefaultContent`
- `initialMode`
- `availableModes`
- `className`
- `variantClassName`
- `onReady`
- `defaultSettings` (typed visual defaults for font/link/list/quote/table/hr/placeholder/codeblock/toolbar)

## Source-mode behavior

Supported modes:

- `visual`
- `jsonb`

When moving from source to visual mode, source content is validated and imported. Invalid source content blocks mode transition to prevent data loss.

## Styling

Include package styles:

```ts
import "@lyfie/luthor/styles.css";
```

You can customize via wrapper classes and CSS variable overrides in your application stylesheet.

### `defaultSettings` and precedence

`defaultSettings` is a style-only prop that maps grouped visual tokens to CSS variables:

- `font.color`, `font.boldColor`
- `link.color`
- `list.markerColor`, `list.checkboxColor`
- `quote.backgroundColor`, `quote.color`, `quote.indicatorColor`
- `table.borderColor`, `table.headerBackgroundColor`
- `hr.color`
- `placeholder.color`
- `codeblock.backgroundColor`
- `toolbar.backgroundColor`

Precedence (highest to lowest):

- `toolbarStyleVars` (toolbar root only) and `quoteStyleVars` (quote vars)
- `editorThemeOverrides`
- `defaultSettings`
- stylesheet-level CSS variable values

## Advanced extension-level options

The extensive preset internally configures options such as:

- font family option catalogs
- text/background color option catalogs
- image upload and alignment behavior
- embed defaults and URL handling
- JSONB persistence-friendly content workflows

For contributor-level details, see [../../developer/luthor/source-file-reference.md](/docs/reference/developer/luthor/source-file-reference/).
