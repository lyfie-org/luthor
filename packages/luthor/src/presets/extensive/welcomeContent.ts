const textNode = (text: string, format = 0, style = "") => ({
  type: "text",
  version: 1,
  text,
  detail: 0,
  format,
  mode: "normal",
  style,
});

const paragraphNode = (
  children: Array<ReturnType<typeof textNode>>,
  format = "",
  indent = 0,
) => ({
  type: "paragraph",
  version: 1,
  format,
  indent,
  direction: null,
  children,
});

export const EXTENSIVE_WELCOME_CONTENT_JSONB = {
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "heading",
        version: 1,
        tag: "h1",
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Extensive Preset: JSONB-First Feature Showcase")],
      },
      paragraphNode([
        textNode("This starter content is now a native "),
        textNode("JSONB", 1),
        textNode(
          " document that demonstrates visual editing without Markdown conversion.",
        ),
      ]),
      {
        type: "heading",
        version: 1,
        tag: "h2",
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Inline formatting + typography")],
      },
      paragraphNode([
        textNode("Bold", 1),
        textNode(" • "),
        textNode("Italic", 2),
        textNode(" • "),
        textNode("Underline", 8),
        textNode(" • "),
        textNode("Strikethrough", 4),
        textNode(" • "),
        textNode("Inline Code", 16),
        textNode(" • "),
        textNode("Subscript", 32),
        textNode(" • "),
        textNode("Superscript", 64),
      ]),
      paragraphNode([
        textNode(
          "Font family + size + color + highlight + line-height can be combined in one sentence.",
          0,
          "font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 18px; line-height: 1.75; color: #2563eb; background-color: #bfdbfe;",
        ),
      ]),
      {
        type: "paragraph",
        version: 1,
        format: "center",
        indent: 0,
        direction: null,
        children: [
          textNode(
            "Centered paragraph with custom style",
            0,
            "font-size: 20px; color: #7c3aed;",
          ),
        ],
      },
      {
        type: "paragraph",
        version: 1,
        format: "right",
        indent: 0,
        direction: null,
        children: [
          textNode(
            "Right-aligned paragraph with highlight",
            128,
            "background-color: #fef08a;",
          ),
        ],
      },
      {
        type: "quote",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          textNode(
            "“Everything in this demo is persisted in JSONB and can round-trip via visual mode.”",
          ),
        ],
      },
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "link",
            version: 1,
            rel: "noreferrer",
            target: "_blank",
            title: "Luthor documentation",
            url: "https://github.com/facebook/lexical",
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Example link node")],
          },
          textNode(" with regular sibling text and emoji support 🎉🔥✅."),
        ],
      },
      {
        type: "heading",
        version: 1,
        tag: "h2",
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Lists")],
      },
      {
        type: "list",
        version: 1,
        listType: "bullet",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            format: "",
            indent: 0,
            direction: null,
            children: [
              paragraphNode([
                textNode("Bullet item with styled text", 0, "color: #16a34a;"),
              ]),
            ],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            format: "",
            indent: 0,
            direction: null,
            children: [
              paragraphNode([
                textNode("Nested formatting in lists", 1),
                textNode(" works great."),
              ]),
            ],
          },
        ],
      },
      {
        type: "list",
        version: 1,
        listType: "number",
        start: 1,
        tag: "ol",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            format: "",
            indent: 0,
            direction: null,
            children: [paragraphNode([textNode("Numbered item 1")])],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            format: "",
            indent: 0,
            direction: null,
            children: [paragraphNode([textNode("Numbered item 2")])],
          },
        ],
      },
      {
        type: "list",
        version: 1,
        listType: "check",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: true,
            format: "",
            indent: 0,
            direction: null,
            children: [paragraphNode([textNode("Checked task item")])],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            checked: false,
            format: "",
            indent: 0,
            direction: null,
            children: [paragraphNode([textNode("Unchecked task item")])],
          },
        ],
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "const",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "keyword"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " content ",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "=",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "operator"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " exportApi",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ".",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "toJSON",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "function"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "(",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ")",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ";",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "type": "linebreak",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "await",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "keyword"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " ",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "saveToDatabase",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "function"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "(",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "{",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " jsonb",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ":",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "operator"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " content ",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "}",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ")",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ";",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "type": "linebreak",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "importApi",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ".",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "fromJSON",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "function"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "(",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "content",
            "type": "code-highlight",
            "version": 1
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ")",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ";",
            "type": "code-highlight",
            "version": 1,
            "highlightType": "punctuation"
          }
        ],
        "direction": null,
        "format": "",
        "indent": 0,
        "type": "code",
        "version": 1,
        "language": "typescript"
      },
      {
        type: "horizontalrule",
        version: 1,
      },
      {
        type: "featureCard",
        version: 1,
        payload: {
          title: "Custom Node: Feature Card",
          description:
            "This block is rendered with createCustomNodeExtension and persists as structured payload.",
          tag: "Custom",
        },
        format: "",
        indent: 0,
        direction: null,
        children: [],
      },
      {
        type: "image",
        version: 1,
        src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
        alt: "Code editor on a laptop",
        caption:
          "Image node with caption, center alignment, and persisted dimensions.",
        alignment: "center",
        width: 780,
        height: 420,
      },
      {
        type: "youtube-embed",
        version: 1,
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        width: 720,
        height: 405,
        alignment: "center",
        start: 0,
      },
      {
        type: "iframe-embed",
        version: 1,
        src: "https://example.com",
        width: 720,
        height: 405,
        alignment: "center",
        title: "Iframe embed example",
      },
      {
        type: "table",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 3,
                colSpan: 1,
                rowSpan: 1,
                width: 240,
                backgroundColor: null,
                children: [paragraphNode([textNode("Feature")])],
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 3,
                colSpan: 1,
                rowSpan: 1,
                width: 320,
                backgroundColor: null,
                children: [paragraphNode([textNode("Status")])],
              },
            ],
          },
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                colSpan: 1,
                rowSpan: 1,
                width: 240,
                backgroundColor: null,
                children: [
                  paragraphNode([textNode("Visual ↔ JSONB switching")]),
                ],
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                colSpan: 1,
                rowSpan: 1,
                width: 320,
                backgroundColor: null,
                children: [paragraphNode([textNode("Round-trip ready ✅")])],
              },
            ],
          },
        ],
      },
      paragraphNode([
        textNode(
          "Use the toolbar, floating toolbar, slash commands (/), and command palette (Ctrl/Cmd+Shift+P) to explore the full preset.",
        ),
      ]),
    ],
  },
} as const;

export const EXTENSIVE_WELCOME_CONTENT_JSONB_STRING = JSON.stringify(
  EXTENSIVE_WELCOME_CONTENT_JSONB,
);