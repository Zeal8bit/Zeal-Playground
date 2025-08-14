(() => {
  const editorEl = document.getElementById('editor');
  const fileName = editorEl.querySelector(':scope > .file-tab .filename');
  const bSaveFile = editorEl.querySelector(':scope > .file-tab .fa-save');
  const bCopyFile = editorEl.querySelector(':scope > .file-tab .fa-copy');
  const textArea = editorEl.querySelector(':scope > [name=content]');

  editorEl.value = DEFAULT_CODE;

  CodeMirror.registerHelper('fold', 'z80-fold', function (cm, start) {
    var lineText = cm.getLine(start.line);

    // ---- z80 comment fold ----
    if (/^\s*;/.test(lineText)) {
      // Skip marker if previous line is also a comment
      if (start.line > cm.firstLine()) {
        var prevText = cm.getLine(start.line - 1);
        if (/^\s*;/.test(prevText)) return;
      }

      var lastLine = cm.lastLine();
      var endLine = start.line + 1;

      while (endLine <= lastLine) {
        var text = cm.getLine(endLine);
        if (!/^\s*;/.test(text)) break;
        endLine++;
      }

      if (endLine > start.line + 1) {
        return {
          from: CodeMirror.Pos(start.line, lineText.length),
          to: CodeMirror.Pos(endLine - 1, cm.getLine(endLine - 1).length),
        };
      }
    }

    // ---- z80 label fold ----
    if (/^[A-Za-z_.$][\w.$]*:/.test(lineText)) {
      var lastLine = cm.lastLine();
      var endLine = start.line + 1;

      while (endLine <= lastLine) {
        var text = cm.getLine(endLine);
        if (/^[A-Za-z_.$][\w.$]*:/.test(text)) break;
        endLine++;
      }

      if (endLine > start.line + 1) {
        return {
          from: CodeMirror.Pos(start.line, lineText.length),
          to: CodeMirror.Pos(endLine - 1, cm.getLine(endLine - 1).length),
        };
      }
    }

    // No folding match
    return;
  });

  const editor = CodeMirror.fromTextArea(textArea, {
    mode: 'z80-playground',
    theme: 'solarized dark',
    lineNumbers: true,
    foldGutter: true,
    styleActiveLine: true,
    lineWrapping: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
      'Ctrl-Q': (cm) => cm.foldCode(cm.getCursor()),
    },
    foldOptions: {
      rangeFinder: CodeMirror.helpers.fold['z80-fold'],
    },
  });

  editorEl.gotoLine = (line, opts = {}) => {
    editor.setCursor({ line });
    editor.scrollIntoView({ line }, 100);
    editor.focus();
    if (opts.error) {
      editorEl.showError(line, true);
    }
    if (opts.className) {
      editor.addLineClass(line, 'background', `cm-${opts.className}`);
    }
    if (opts.gutter) {
      editorEl.showError(line, opts.gutter);
    }
  };

  editorEl.showError = (line, active = true) => {
    if (active) {
      const el = document.createElement('div');
      el.classList.add('cm-error-marker');
      el.innerHTML = '●';
      editor.setGutterMarker(line, 'CodeMirror-linenumbers', el);
      editor.addLineClass(line, 'background', `cm-error`);
    } else {
      editor.removeLineClass(line, 'background', 'cm-error');
      editor.setGutterMarker(line, 'CodeMirror-linenumbers', null);
    }
  };

  editorEl.gotoLabel = (label, highlight = false) => {
    const lineCount = editor.lineCount();
    const pattern = new RegExp('^\\s*' + label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':');
    for (let i = 0; i < lineCount; i++) {
      const line = editor.getLine(i);
      if (pattern.test(line)) {
        editorEl.gotoLine(i);
        return true;
      }
    }
    return false;
  };

  editorEl.editor = editor;
  editorEl.openFile = (o) => {
    editor.fileName = o.name;
    fileName.textContent = o.name ?? '* new file';
    editor.setValue(o.text);

    const lineCount = editor.lineCount();
    let lastEmptyLine = 0;
    for (let i = 0; i < lineCount; i++) {
      const line = editor.getLine(i).trim();
      if (line.length && !line.startsWith(';')) {
        editorEl.gotoLine(i);
        return;
      }
      if (!line.length) lastEmptyLine = i;
    }

    editorEl.gotoLine(lastEmptyLine);
    return Promise.resolve(o);
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
  bCopyFile.addEventListener('click', (e) => {
    const text = editor.getValue();
    console.log('copy-file');
    if (navigator.clipboard?.writeText) {
      console.log('writeText', text);
      navigator.clipboard.writeText(text);

      e.target.classList.add('fa-check');
      e.target.classList.remove('fa-copy');
      setTimeout(() => {
        console.log('remove check');
        e.target.classList.remove('fa-check');
        e.target.classList.add('fa-copy');
      }, 300);
    }
  });
})();
