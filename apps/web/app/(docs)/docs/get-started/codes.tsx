import { RegisteredCodeSnippet } from "../../lib/types";

// Install examples
export const INSTALLATION_EXAMPLES: RegisteredCodeSnippet[] = [
  {
    id: "install-npm",
    code: "npm install @lyfie/luthor",
    language: "bash",
    title: "Install with npm",
    description: "Install Luthor using npm",
  },
  {
    id: "install-pnpm",
    code: "pnpm add @lyfie/luthor",
    language: "bash",
    title: "Install with pnpm",
    description: "Install Luthor using pnpm",
  },
  {
    id: "install-yarn",
    code: "yarn add @lyfie/luthor",
    language: "bash",
    title: "Install with yarn",
    description: "Install Luthor using yarn",
  },
];

// Basic usage snippets
export const BASIC_USAGE_EXAMPLES: RegisteredCodeSnippet[] = [
  {
    id: "basic-import",
    code: `import { createEditorSystem } from '@lyfie/luthor'
import { DefaultTemplate } from '@lyfie/luthor/templates'`,
    language: "typescript",
    title: "Import Luthor",
    description: "Import the main components",
  },
  {
    id: "basic-editor",
    code: `function MyEditor() {
  return (
    <DefaultTemplate
      onReady={(editor) => {
        console.log('Editor ready!')
        // Use editor APIs here
        editor.injectMarkdown('# Hello World')
      }}
    />
  )
}`,
    language: "tsx",
    title: "Basic Editor Component",
    description: "Create a basic editor with ready callback",
    highlightLines: [3, 4, 5, 6, 7],
  },
  {
    id: "editor-with-content",
    code: `function MyEditor() {
  const [content, setContent] = useState('')

  const handleReady = (editor) => {
    // Seed initial content
    editor.injectMarkdown('# Welcome!\\n\\nStart writing...')

    // Persist content on change
    editor.onChange = (newContent) => {
      setContent(newContent)
    }
  }

  return <DefaultTemplate onReady={handleReady} />
}`,
    language: "tsx",
    title: "Editor with Content Management",
    description: "Load and save editor content",
    highlightLines: [5, 6, 9, 10, 11],
  },
  {
    id: "richtext-with-extensions",
    code: `import { createEditorSystem, richTextExtension, boldExtension, italicExtension, historyExtension } from "@lyfie/luthor"

// Declare extensions as const for type safety
const extensions = [
  richTextExtension.configure({
    placeholder: "Start writing...",
    classNames: {
      container: "my-editor-container",
      contentEditable: "my-editor-content",
      placeholder: "my-editor-placeholder"
    }
  }),
  boldExtension,
  italicExtension,
  historyExtension
] as const

// Create a typed editor system
const { Provider, useEditor } = createEditorSystem<typeof extensions>()

function MyEditor() {
  return (
    <Provider extensions={extensions}>
      <div className="my-editor">
        {/* RichText renders automatically */}
        {/* Place your toolbar or other UI here */}
      </div>
    </Provider>
  )
}`,
    language: "typescript",
    title: "Rich Text with Extensions",
    description: "Create a rich text editor with multiple extensions",
    highlightLines: [
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    ],
  },
  {
    id: "richtext-as-extension",
    code: `import { createEditorSystem, richTextExtension } from "@lyfie/luthor"

// Declare extensions
const extensions = [
  richTextExtension.configure({
    placeholder: "Start writing...",
    classNames: {
      container: "my-editor-container",
      contentEditable: "my-editor-content",
      placeholder: "my-editor-placeholder"
    }
  })
] as const

// Create a typed editor system
const { Provider, useEditor } = createEditorSystem<typeof extensions>()

function MyEditor() {
  return (
    <Provider extensions={extensions}>
      <div className="my-editor">
        {/* RichText renders automatically */}
        {/* Place your toolbar or other UI here */}
      </div>
    </Provider>
  )
}`,
    language: "tsx",
    title: "RichText as Extension",
    description: "Use RichText as a Luthor extension with createEditorSystem",
    highlightLines: [5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21],
  },
  {
    id: "richtext-lexical-direct",
    code: `import { createEditorSystem, boldExtension, italicExtension, historyExtension } from "@lyfie/luthor"
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'

// Declare extensions without RichText
const extensions = [
  boldExtension,
  italicExtension,
  historyExtension
] as const

// Create a typed editor system
const { Provider, useEditor } = createEditorSystem<typeof extensions>()


  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Provider extensions={extensions}>
        <div className="my-editor">
          <RichTextPlugin
            contentEditable={<ContentEditable className="my-editor-content" />}
            placeholder={<div className="my-editor-placeholder">Start writing...</div>}
          />
          {/* Place your toolbar or other UI here */}
        </div>
      </Provider>
    </LexicalComposer>
  )
}`,
    language: "tsx",
    title: "RichText with Lexical Direct",
    description: "Use createEditorSystem with manual RichTextPlugin setup",
    highlightLines: [5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    id: "theming-with-luthor",
    code: `// Define a custom theme with class names
const simpleTheme: LuthorTheme = {
  // Editor content styles
  paragraph: 'luthor-paragraph',
  heading: {
    h1: 'themed-heading-h1',
    h2: 'themed-heading-h2',
    h3: 'themed-heading-h3',
  },
  list: {
    ul: 'themed-list-ul',
    ol: 'themed-list-ol',
    listitem: 'themed-list-li',
  },
  quote: 'luthor-quote',
  link: 'luthor-link',
  text: {
    bold: 'luthor-text-bold',
    italic: 'luthor-text-italic',
    underline: 'luthor-text-underline',
  },
}

const { Provider, useEditor } = createEditorSystem<typeof extensions>()

function ThemedEditor() {
  return (
    <Provider
      extensions={extensions}
      config={{ theme: simpleTheme }}
    >
      <RichText placeholder="Themed editor content..." />
    </Provider>
  )
}`,
    language: "tsx",
    title: "Theming with Luthor",
    description: "Apply custom themes to your Luthor editor",
    highlightLines: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29,
    ],
  },
];

// Combine examples for default export
export default [...INSTALLATION_EXAMPLES, ...BASIC_USAGE_EXAMPLES];
