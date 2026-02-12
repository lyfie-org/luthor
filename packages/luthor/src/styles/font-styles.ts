export const injectEditorStyles = () => {
  if (typeof document === 'undefined') return; // SSR Check

  const styleId = 'luthor-editor-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .fs-bold { font-weight: bold; }
    .fs-italic { font-style: italic; }
    .fs-underline { text-decoration: underline; }
    .fs-strikethrough { text-decoration: line-through; }
    .fs-highlight { margin: 0 5px; }
    .fs-code { 
      background-color: rgba(0,0,0,0.05); 
      padding: 2px 4px; 
      font-family: monospace; 
    }
    .fs-subscript { 
      vertical-align: sub; 
    }
    .fs-superscript { 
      vertical-align: super;
    }
  `;
  document.head.appendChild(style);
};