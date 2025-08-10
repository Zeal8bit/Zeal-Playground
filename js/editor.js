(() => {
  const editorEl = document.getElementById('editor');
  const fileTab = editorEl.querySelector(':scope > .file-tab');
  const textArea = editorEl.querySelector(':scope > [name=content]');

  editorEl.value = DEFAULT_CODE;
  const editor = CodeMirror.fromTextArea(textArea, {
    mode: 'z80',
    theme: 'solarized dark',
    lineNumbers: true,
    lineWrapping: true,
    styleActiveLine: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
      'Ctrl-Q': (cm) => cm.foldCode(cm.getCursor()),
    },
  });

  editorEl.editor = editor;
  editorEl.open = (o) => {
    console.log('open', o);
    fileTab.textContent = o.name;
    editor.setValue(o.text);
  };
  editorEl.getValue = () => editor.getValue();
})();
