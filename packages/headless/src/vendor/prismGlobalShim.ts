import Prism from "prismjs";

type GlobalPrismHost = typeof globalThis & {
  Prism?: unknown;
};

export function ensurePrismGlobalForLexical(): void {
  const globalHost = globalThis as GlobalPrismHost;
  if (!globalHost.Prism) {
    globalHost.Prism = Prism;
  }
}

ensurePrismGlobalForLexical();
