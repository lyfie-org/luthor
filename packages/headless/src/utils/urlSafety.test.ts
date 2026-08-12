/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOWED_URL_SCHEMES,
  EMBED_ALLOWED_URL_SCHEMES,
  isSafeUrl,
  sanitizeUrlForAttribute,
} from "./urlSafety";

describe("isSafeUrl default allowlist", () => {
  it("accepts the everyday link schemes", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("https://example.com/path?q=1#frag")).toBe(true);
    expect(isSafeUrl("mailto:someone@example.com")).toBe(true);
    expect(isSafeUrl("tel:+15551234567")).toBe(true);
  });

  it("accepts same-document and protocol-relative references", () => {
    expect(isSafeUrl("#section-2")).toBe(true);
    expect(isSafeUrl("//example.com/asset.png")).toBe(true);
  });

  it("rejects script-bearing schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects obfuscated script schemes the URL parser normalizes", () => {
    expect(isSafeUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeUrl("java\tscript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\nscript:alert(1)")).toBe(false);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("  javascript:alert(1)  ")).toBe(false);
  });

  it("rejects other non-allowlisted schemes by default", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("ftp://example.com/file")).toBe(false);
    expect(isSafeUrl("obsidian://open?vault=notes")).toBe(false);
    expect(isSafeUrl("blob:https://example.com/uuid")).toBe(false);
  });

  it("rejects empty, unparseable, and relative-path input", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("   ")).toBe(false);
    expect(isSafeUrl("not a url")).toBe(false);
    expect(isSafeUrl("/relative/path")).toBe(false);
    expect(isSafeUrl("./relative")).toBe(false);
  });
});

describe("isSafeUrl custom allowlists", () => {
  it("lets a host opt in to a custom scheme deliberately", () => {
    const options = { allowedSchemes: [...DEFAULT_ALLOWED_URL_SCHEMES, "obsidian"] };
    expect(isSafeUrl("obsidian://open?vault=notes", options)).toBe(true);
    expect(isSafeUrl("javascript:alert(1)", options)).toBe(false);
  });

  it("keeps the embed allowlist stricter than the link allowlist", () => {
    const options = { allowedSchemes: EMBED_ALLOWED_URL_SCHEMES };
    expect(isSafeUrl("https://example.com/embed", options)).toBe(true);
    expect(isSafeUrl("mailto:someone@example.com", options)).toBe(false);
    expect(isSafeUrl("javascript:alert(1)", options)).toBe(false);
  });
});

describe("sanitizeUrlForAttribute", () => {
  it("passes safe URLs through unchanged", () => {
    expect(sanitizeUrlForAttribute("https://example.com/a?b=c")).toBe(
      "https://example.com/a?b=c",
    );
  });

  it("replaces hostile URLs with about:blank instead of deleting them", () => {
    expect(sanitizeUrlForAttribute("javascript:alert(1)")).toBe("about:blank");
    expect(
      sanitizeUrlForAttribute("data:text/html,x", {
        allowedSchemes: EMBED_ALLOWED_URL_SCHEMES,
      }),
    ).toBe("about:blank");
  });
});
