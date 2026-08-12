/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { htmlToJSON } from "./html";

/**
 * Two-sided corpus for the HTML import path. The first half feeds hostile
 * markup through htmlToJSON and pins down exactly what is stripped; the
 * second half feeds realistic paste sources (Word, Google Docs, Sheets,
 * VS Code) and pins down that their formatting still converts. Both halves
 * matter: an import that keeps XSS out but eats a user's table is still
 * broken.
 */

type JsonNode = {
  type?: string;
  text?: string;
  format?: number | string;
  children?: JsonNode[];
  [key: string]: unknown;
};

const OPTIONS = { metadataMode: "none" as const };

function convert(html: string) {
  return htmlToJSON(html, OPTIONS);
}

function serialized(html: string): string {
  return JSON.stringify(convert(html));
}

function collectNodes(document: { root: JsonNode }): JsonNode[] {
  const found: JsonNode[] = [];
  const visit = (node: JsonNode): void => {
    found.push(node);
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(document.root);
  return found;
}

function nodeTypes(html: string): string[] {
  return collectNodes(convert(html) as { root: JsonNode })
    .map((node) => node.type ?? "")
    .filter(Boolean);
}

function fullText(html: string): string {
  return collectNodes(convert(html) as { root: JsonNode })
    .map((node) => node.text ?? "")
    .join("");
}

describe("hostile HTML: script and style vehicles", () => {
  it("drops <script> elements including their text payload", () => {
    const json = serialized("<script>alert('pwned')</script><p>after</p>");
    expect(json).not.toContain("pwned");
    expect(fullText("<script>alert('pwned')</script><p>after</p>")).toBe("after");
  });

  it("drops <style> elements including their text payload", () => {
    const json = serialized("<style>body{background:red}</style><p>kept</p>");
    expect(json).not.toContain("background:red");
    expect(json).toContain("kept");
  });

  it("drops <svg> trees with embedded script and event handlers", () => {
    const html = `<p>before</p><svg onload="alert(1)"><script>alert(2)</script></svg><p>after</p>`;
    const json = serialized(html);
    expect(json).not.toContain("alert");
    expect(json).not.toContain("onload");
    expect(fullText(html)).toBe("beforeafter");
  });

  it("drops <object>, <embed>, and <template> elements", () => {
    const html = `<p>a</p><object data="evil.swf">fallback</object><embed src="evil.swf"><template><script>alert(1)</script></template><p>b</p>`;
    const json = serialized(html);
    expect(json).not.toContain("evil.swf");
    expect(json).not.toContain("alert");
    expect(fullText(html)).toBe("ab");
  });

  it("drops form controls but keeps surrounding content", () => {
    const html = `<form action="https://evil.example/collect"><p>inside</p><input value="x"><button>Go</button></form>`;
    const json = serialized(html);
    expect(json).not.toContain("evil.example");
    expect(json).toContain("inside");
  });
});

describe("hostile HTML: event-handler attributes", () => {
  it("strips on* attributes from every element", () => {
    const html = `<p onclick="alert(1)" onmouseover="alert(2)">text</p><div onfocus="alert(3)"><em ondblclick="alert(4)">em</em></div>`;
    const json = serialized(html);
    expect(json).not.toContain("alert");
    expect(json).not.toContain("onclick");
    expect(fullText(html)).toBe("textem");
  });

  it("strips onerror from an image while keeping the image", () => {
    const html = `<img src="https://example.com/pic.png" alt="pic" onerror="alert(1)">`;
    const json = serialized(html);
    expect(json).not.toContain("alert");
    expect(json).toContain("https://example.com/pic.png");
  });
});

describe("hostile HTML: URL-bearing attributes", () => {
  it("unwraps anchors with javascript: hrefs, preserving their text", () => {
    const html = `<p><a href="javascript:alert(1)">click me</a></p>`;
    const document = convert(html) as { root: JsonNode };
    expect(JSON.stringify(document)).not.toContain("javascript:");
    expect(collectNodes(document).some((node) => node.type === "link")).toBe(false);
    expect(fullText(html)).toBe("click me");
  });

  it("unwraps anchors with data: and vbscript: hrefs", () => {
    for (const href of ["data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)"]) {
      const html = `<p><a href="${href}">x</a></p>`;
      const document = convert(html) as { root: JsonNode };
      expect(collectNodes(document).some((node) => node.type === "link")).toBe(false);
    }
  });

  it("keeps anchors with http(s) and mailto hrefs", () => {
    const html = `<p><a href="https://example.com/a">a</a> <a href="mailto:x@example.com">b</a></p>`;
    const document = convert(html) as { root: JsonNode };
    const links = collectNodes(document).filter((node) => node.type === "link");
    expect(links.map((node) => node.url)).toEqual([
      "https://example.com/a",
      "mailto:x@example.com",
    ]);
  });

  it("neutralizes a script-scheme src smuggled into an embed wrapper", () => {
    const html = `<div data-iframe-embed=""><iframe src="javascript:alert(1)" width="640" height="360"></iframe></div>`;
    const json = serialized(html);
    expect(json).not.toContain("javascript:alert(1)");
  });

  it("keeps an http(s) src on an embed wrapper", () => {
    const html = `<figure data-iframe-embed="" data-align="center"><iframe src="https://maps.example.com/embed" width="640" height="360"></iframe></figure>`;
    const document = convert(html) as { root: JsonNode };
    const embed = collectNodes(document).find((node) => node.type === "iframe-embed");
    expect(embed).toBeDefined();
    expect(embed!.src).toBe("https://maps.example.com/embed");
  });

  it("removes images with unsafe src schemes entirely", () => {
    const html = `<p>text</p><img src="javascript:alert(1)" alt="x">`;
    const json = serialized(html);
    expect(json).not.toContain("javascript:");
    expect(json).toContain("text");
  });

  it("keeps data:image/* sources so pasted inline images survive", () => {
    const pixel =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const json = serialized(`<img src="${pixel}" alt="dot">`);
    expect(json).toContain("data:image/png");
  });

  it("removes srcdoc so an iframe cannot carry an inline document", () => {
    const html = `<div data-iframe-embed=""><iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;" src="https://example.com/e"></iframe></div>`;
    const json = serialized(html);
    expect(json).not.toContain("srcdoc");
    expect(json).not.toContain("alert(1)");
  });
});

describe("hostile HTML: style attribute vehicles", () => {
  it("drops style attributes carrying url() or expression()", () => {
    const html = `<p style="background:url(javascript:alert(1))">a</p><p style="width:expression(alert(2))">b</p>`;
    const json = serialized(html);
    expect(json).not.toContain("alert");
    expect(fullText(html)).toBe("ab");
  });

  it("keeps benign style attributes that drive conversion", () => {
    const html = `<p style="text-align:center">centered</p>`;
    const document = convert(html) as { root: JsonNode };
    const paragraph = collectNodes(document).find((node) => node.type === "paragraph");
    expect(paragraph?.format).toBe("center");
  });
});

describe("legitimate paste sources keep their formatting", () => {
  it("converts Word-flavored markup", () => {
    const html = `
      <p class="MsoNormal"><b>Bold</b> and <i>italic</i> text<span style="mso-spacerun:yes"> </span></p>
      <h1>Heading</h1>
      <table><tr><td>A1</td><td>B1</td></tr></table>`;
    const types = nodeTypes(html);
    expect(types).toContain("heading");
    expect(types).toContain("table");
    const document = convert(html) as { root: JsonNode };
    const boldNode = collectNodes(document).find(
      (node) => node.text === "Bold" && typeof node.format === "number" && (node.format & 1) === 1,
    );
    expect(boldNode).toBeDefined();
  });

  it("converts Google-Docs-flavored markup", () => {
    const html = `<b style="font-weight:normal" id="docs-internal-guid-abc123"><p dir="ltr"><span style="font-weight:700">Strong</span><span> normal</span></p><ul><li><p dir="ltr"><span>item</span></p></li></ul></b>`;
    const document = convert(html) as { root: JsonNode };
    const nodes = collectNodes(document);
    const strong = nodes.find(
      (node) => node.text === "Strong" && typeof node.format === "number" && (node.format & 1) === 1,
    );
    expect(strong).toBeDefined();
    expect(nodes.some((node) => node.type === "list")).toBe(true);
    expect(nodes.find((node) => node.text === " normal")).toBeDefined();
  });

  it("converts a Sheets-style table paste", () => {
    const html = `<table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed"><colgroup><col width="100"><col width="100"></colgroup><tbody><tr style="height:21px;"><td style="text-align:right;">1</td><td>x</td></tr></tbody></table>`;
    const types = nodeTypes(html);
    expect(types).toContain("table");
    expect(types.filter((type) => type === "tablecell")).toHaveLength(2);
    expect(fullText(html)).toContain("1");
  });

  it("converts VS-Code-style colored code spans without losing text", () => {
    const html = `<div style="color:#d4d4d4;background-color:#1e1e1e;font-family:Consolas"><span style="color:#569cd6;">const</span><span> x = </span><span style="color:#b5cea8;">1</span></div>`;
    expect(fullText(html)).toBe("const x = 1");
  });

  it("converts an Apple Notes paste", () => {
    // Apple Notes emits inline styles on every block plus its own class
    // names; the wrapper div is unknown markup that must unwrap, not eat
    // its children.
    const html = `<div style="font-family:'Helvetica Neue';font-size:14px"><p class="p1" style="margin:0px"><b>Shopping</b></p><ul class="ul1"><li class="li1" style="margin:0px">Milk</li><li class="li1">Eggs</li></ul></div>`;
    const types = nodeTypes(html);

    expect(types).toContain("list");
    expect(types.filter((type) => type === "listitem")).toHaveLength(2);
    expect(fullText(html)).toContain("Milk");
    expect(fullText(html)).toContain("Eggs");
  });

  it("converts a plain browser-page selection", () => {
    // A copy from an ordinary article: semantic tags, a link, and a
    // figure the sanitizer must not strip.
    const html = `<article><h2>Title</h2><p>Body with <a href="https://example.com/ref">a link</a> and <em>emphasis</em>.</p><figure><img src="https://example.com/p.png" alt="pic"><figcaption>Caption</figcaption></figure></article>`;
    const document = convert(html) as { root: JsonNode };
    const nodes = collectNodes(document);

    expect(nodes.some((node) => node.type === "heading")).toBe(true);
    expect(nodes.find((node) => node.type === "link")?.url).toBe(
      "https://example.com/ref",
    );
    expect(JSON.stringify(document)).toContain("https://example.com/p.png");
    // The figure is absorbed into the image node, so its caption lives on
    // that node rather than in the document text stream.
    const image = nodes.find((node) => node.type === "image");
    expect(image?.caption).toBe("Caption");
  });

  it("keeps blockquotes, code blocks, lists, and rules intact", () => {
    const html = `<blockquote>quote</blockquote><pre><code>let x;</code></pre><ol start="3"><li>third</li></ol><hr>`;
    const types = nodeTypes(html);
    expect(types).toContain("quote");
    expect(types).toContain("code");
    expect(types).toContain("list");
    expect(types).toContain("horizontalrule");
  });
});

describe("sanitization opt-out for trusted markup", () => {
  it("can be disabled explicitly for a host that trusts its source", () => {
    const html = `<p><a href="app-internal://record/42">record</a></p>`;
    const strict = convert(html) as { root: JsonNode };
    expect(collectNodes(strict).some((node) => node.type === "link")).toBe(false);

    const trusting = htmlToJSON(html, { ...OPTIONS, sanitize: false }) as {
      root: JsonNode;
    };
    const link = collectNodes(trusting).find((node) => node.type === "link");
    expect(link?.url).toBe("app-internal://record/42");
  });

  it("supports allowlisting a custom link scheme without disabling everything", () => {
    const html = `<p><a href="obsidian://open?vault=n">note</a><a href="javascript:alert(1)">bad</a></p>`;
    const document = htmlToJSON(html, {
      ...OPTIONS,
      sanitize: { allowedLinkSchemes: ["http", "https", "obsidian"] },
    }) as { root: JsonNode };
    const links = collectNodes(document).filter((node) => node.type === "link");
    expect(links.map((node) => node.url)).toEqual(["obsidian://open?vault=n"]);
  });
});
