export const injectEditorStyles = () => {
  if (typeof document === 'undefined') return; // SSR Check

  const styleId = 'luthor-editor-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .lfs-bold { font-weight: bold; }
    .lfs-italic { font-style: italic; }
    .lfs-underline { text-decoration: underline; }
    .lfs-strikethrough { text-decoration: line-through; }
    .lfs-highlight { margin: 0 5px; }
    .lfs-code { 
      background-color: rgba(0,0,0,0.05); 
      padding: 2px 4px; 
      font-family: monospace; 
    }
    .lfs-subscript { 
      vertical-align: sub; 
    }
    .lfs-superscript { 
      vertical-align: super;
    }
  `;

  document.head.insertBefore(style, document.head.firstChild);
};