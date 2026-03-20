import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-json5";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-ini";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-go";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";

export type PrismTheme = "light" | "dark";

const PRISM_THEME_LINK_ID = "luthor-prism-theme";

const prismScope = globalThis as typeof globalThis & { Prism?: typeof Prism };
if (prismScope.Prism !== Prism) {
  prismScope.Prism = Prism;
}

export function syncPrismTheme(theme: PrismTheme): void {
  if (typeof window === "undefined") {
    return;
  }

  const href = theme === "dark" ? "/prismjs/themes/prism-okaidia.css" : "/prismjs/themes/prism.css";
  const existing = document.getElementById(PRISM_THEME_LINK_ID);
  const link = existing instanceof HTMLLinkElement ? existing : document.createElement("link");

  if (!(existing instanceof HTMLLinkElement)) {
    link.id = PRISM_THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}
