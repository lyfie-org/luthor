import "prismjs";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-go";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-ini";
import "prismjs/components/prism-json5";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-yaml";

export const PRISM_LANGUAGE_PACK_IDS = [
  "bash",
  "csharp",
  "docker",
  "go",
  "graphql",
  "ini",
  "json",
  "json5",
  "kotlin",
  "php",
  "ruby",
  "toml",
  "yaml",
] as const;

let isPrismLanguagePackEnsured = false;

type PrismRuntime = {
  languages?: Record<string, unknown>;
};

function getPrismRuntime(): PrismRuntime | null {
  const prism = (globalThis as { Prism?: PrismRuntime }).Prism;
  if (!prism || !prism.languages) {
    return null;
  }

  return prism;
}

export function ensurePrismLanguagePackLoaded(): void {
  if (isPrismLanguagePackEnsured) {
    return;
  }

  const prism = getPrismRuntime();
  if (!prism?.languages) {
    return;
  }

  const hasAtLeastOneCuratedGrammar = PRISM_LANGUAGE_PACK_IDS.some((languageId) =>
    Object.prototype.hasOwnProperty.call(prism.languages, languageId),
  );

  if (hasAtLeastOneCuratedGrammar) {
    isPrismLanguagePackEnsured = true;
  }
}

