(() => {
  const editorEl = document.getElementById('editor');
  const fileName = editorEl.querySelector(':scope > .file-tab .filename');
  const bSaveFile = editorEl.querySelector(':scope > .file-tab .fa-save');
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
  editorEl.openFile = (o) => {
    console.log('open', o);
    editor.fileName = o.name;
    fileName.textContent = o.name ?? '* new file';
    editor.setValue(o.text);

    const lineCount = editor.lineCount();
    let lastEmptyLine = 0;
    for (let i = 0; i < lineCount; i++) {
      const line = editor.getLine(i).trim();
      if (line.length && !line.startsWith(';')) {
        editor.setCursor(i, 0);
        editor.focus();
        return;
      }
      if (!line.length) lastEmptyLine = i;
    }

    editor.setCursor(lastEmptyLine, 0);
    editor.focus();
  };

  editorEl.getValue = () => editor.getValue();

  bSaveFile.addEventListener('click', () => {
    let name = editor.fileName?.trim();
    if (!name || name.length < 0) {
      name = prompt('Filename: ', 'user.asm');
      if (name === null) {
        console.warn('Invalid filename', name);
        return;
      }
    }

    console.log('saving file', name);

    localStorage.setItem(
      `file:${name}`,
      JSON.stringify({
        name: name,
        path: `user/${name}`,
        text: editor.getValue(),
      }),
    );

    const e = new CustomEvent('file-saved', {
      detail: {
        name: name,
        path: `user/${name}`,
        text: editor.getValue(),
      },
      bubbles: true,
      cancelable: true,
    });
    editorEl.dispatchEvent(e);
  });
})();
