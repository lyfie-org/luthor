import {InitialConfigType, LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {CustomHistoryActions} from "./components";
import {OnChangePlugin} from "./components";
import {CustomTextActions} from "./components";
import {CustomAlignActions} from "./components";

import { injectEditorStyles } from './styles/font-styles';
import { useEffect } from 'react';

import initialState from './initialState.json';

const lexicalConfig: InitialConfigType = {
  namespace: 'MyEditor',
  theme: {
    text: {
        bold: "fs-bold",
        italic: "fs-italic",
        underline: "fs-underline",
        code: 'fs-code',
        highlight: 'fs-highlight',
        strikethrough: 'fs-strikethrough',
        subscript: 'fs-subscript',
        superscript: 'fs-superscript',
    },
  },
  // editorState: JSON.stringify(initialState),
  onError: (error: Error) => {
    console.error('Lexical Error:', error);
  },
};

export function LuthorEditor() {
  useEffect(() => {
    injectEditorStyles();
  }, []);

  return (
    <div style={{ padding: '20px', position: 'relative', maxWidth: '600px' }}>
      <LexicalComposer initialConfig={lexicalConfig}>
        <div style={{ position: 'relative' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                style={{
                  minHeight: '150px',
                  border: '2px solid red',
                  borderRadius: '5px',
                  padding: '10px',
                  outline: 'none',
                }} 
              />
            }
            placeholder={
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: '#999',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                Enter some text...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />          
        <HistoryPlugin />
        <OnChangePlugin />
        <CustomHistoryActions />
        <CustomTextActions />
        <CustomAlignActions />
        </div>
      </LexicalComposer>
    </div>
  );
}