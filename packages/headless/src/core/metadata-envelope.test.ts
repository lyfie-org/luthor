import { describe, expect, it } from "vitest";
import {
  appendMetadataEnvelopes,
  collectSupportedNodeMetadataPatches,
  extractMetadataEnvelopes,
  prepareDocumentForBridge,
  rehydrateDocumentFromEnvelopes,
  type JsonDocument,
  type MetadataEnvelope,
} from "./metadata-envelope";

const SIMPLE_SUPPORTED_TYPES = new Set(["root", "paragraph", "text"]);

function createFixtureDocument(): JsonDocument {
  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children: [
        {
          type: "paragraph",
          version: 1,
          format: "",
          indent: 0,
          direction: null,
          children: [
            {
              type: "text",
              version: 1,
              text: "Intro",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
            },
          ],
        },
        {
          type: "featureCard",
          version: 1,
          payload: { title: "AI Draft" },
        },
      ],
    },
  };
}

describe("metadata envelopes", () => {
  it("appends and extracts envelope comments", () => {
    const envelope: MetadataEnvelope = {
      id: "featureCard:1:1",
      type: "featureCard",
      path: [1],
      fallback: "[Unsupported featureCard preserved in markdown metadata]",
      node: {
        type: "featureCard",
        version: 1,
        payload: { title: "AI Draft" },
      },
    };

    const content = appendMetadataEnvelopes("Hello world", [envelope]);
    expect(content).toContain("<!-- luthor:meta v1");

    const extracted = extractMetadataEnvelopes(content);
    expect(extracted.content).toBe("Hello world");
    expect(extracted.envelopes).toEqual([envelope]);
    expect(extracted.warnings).toHaveLength(0);
  });

  it("ignores malformed and unknown-version envelopes safely", () => {
    const source = [
      "Hello",
      "<!-- luthor:meta v2 {\"id\":\"x\",\"type\":\"y\",\"path\":[0],\"node\":{}} -->",
      "<!-- luthor:meta v1 {not-json} -->",
    ].join("\n");

    const extracted = extractMetadataEnvelopes(source);
    expect(extracted.content).toBe("Hello");
    expect(extracted.envelopes).toEqual([]);
    expect(extracted.warnings).toHaveLength(2);
  });

  it("sanitizes unsupported nodes and rehydrates them after conversion", () => {
    const prepared = prepareDocumentForBridge(createFixtureDocument(), {
      mode: "markdown",
      supportedNodeTypes: SIMPLE_SUPPORTED_TYPES,
    });

    expect(prepared.envelopes).toHaveLength(1);
    expect((prepared.document.root.children as any[])[1]).toMatchObject({
      type: "paragraph",
    });

    const restored = rehydrateDocumentFromEnvelopes(
      prepared.document,
      prepared.envelopes,
    );
    expect((restored.root.children as any[])[1]).toMatchObject({
      type: "featureCard",
      payload: { title: "AI Draft" },
    });
  });

  it("merges patch envelopes without overwriting native fields", () => {
    const document: JsonDocument = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [
              {
                type: "text",
                version: 1,
                text: "Edited",
                detail: 0,
                format: 1,
                mode: "normal",
                style: "",
              },
            ],
          },
        ],
      },
    };

    const merged = rehydrateDocumentFromEnvelopes(document, [
      {
        id: "text:0.0:1",
        type: "text",
        path: [0, 0],
        fallback: "",
        strategy: "merge",
        node: {
          style: "color: red;",
          __luthorTextFormatExtra: 64,
        },
      },
    ]);

    const textNode = ((merged.root.children as any[])[0].children as any[])[0];
    expect(textNode.text).toBe("Edited");
    expect(textNode.style).toBe("color: red;");
    expect(textNode.format).toBe(65);
  });

  it("collects merge patches only for supported node types", () => {
    const document = createFixtureDocument();
    const patches = collectSupportedNodeMetadataPatches(document, {
      mode: "markdown",
      supportedNodeTypes: SIMPLE_SUPPORTED_TYPES,
      extractPatch: ({ type, node }) => {
        if (type !== "text") {
          return null;
        }
        return {
          style: node.style,
        };
      },
    });

    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({
      strategy: "merge",
      type: "text",
      path: [0, 0],
      node: {
        style: "",
      },
    });
  });
});
