(() => {
  const editorEl = document.getElementById('editor');
  const fileName = editorEl.querySelector(':scope > .file-tab .filename');
  const bSaveFile = editorEl.querySelector(':scope > .file-tab .fa-save');
  const bCopyFile = editorEl.querySelector(':scope > .file-tab .fa-copy');
  const textArea = editorEl.querySelector(':scope > [name=content]');
  let isDirty = false;

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
    // base settings
    mode: 'z80-playground',
    theme: 'zeal',
    // indent settings
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,

    // line settings
    styleActiveLine: true,
    lineWrapping: true,

    // gutter settings
    lineNumbers: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    foldOptions: {
      rangeFinder: CodeMirror.helpers.fold['z80-fold'],
    },

    // key bindings
    extraKeys: {
      'Ctrl-Q': (cm) => {
        cm.foldCode(cm.getCursor());
        return false;
      },
      'Cmd-Q': (cm) => {
        cm.foldCode(cm.getCursor());
        return false;
      },
      'Ctrl-/': (cm) => {
        const pos = cm.getCursor();
        cm.toggleComment({ lineComment: ';', blockComment: { start: ';', end: ';' } });
        cm.setCursor(pos); // keep cursor position
        return false;
      },
      'Cmd-/': (cm) => {
        const pos = cm.getCursor();
        cm.toggleComment({ lineComment: ';', blockComment: { start: ';', end: ';' } });
        cm.setCursor(pos); // keep cursor position
        return false;
      },
    },
  });
  editorEl.editor = editor;
  document.fonts.load('16px "BigBlue Terminal 437TT"').then(() => editor.refresh());

  // The entry document owns editing, undo, saving, and the next build.
  // Included documents are read-only snapshots of the sources in this build.
  const entry = editor.getDoc();
  editorEl.entryDoc = entry;
  const sourceNav = editorEl.querySelector('.debug-sources');
  const includes = new Map();
  const breakpoints = new Map(); // CodeMirror line handle -> owning document
  const locations = new Map(); // linked address -> document and line
  const addresses = new Map(); // document -> first address for each source line
  let installed = new Set();
  let marker;
  let currentPC;
  let activeSources = new Map();

  function showDocument(doc) {
    if (editor.getDoc() === doc) return;
    editor.swapDoc(doc);
    const included = doc !== entry;
    editor.setOption('readOnly', included);
    bSaveFile.disabled = included;
    const path = [...activeSources].find(([, source]) => source === doc)?.[0];
    fileName.textContent = included ? path.replace(/^files\//, '') + ' (read-only)' :
      (isDirty ? '* ' : '') + (editor.fileName || 'new file');
    fileName.title = included ? 'Included source from this build: ' + path : '';
    fileName.classList.toggle('info', !included && isDirty);
    for (const button of sourceNav.children) {
      button.setAttribute('aria-pressed', String(activeSources.get(button.value) === doc));
    }
  }

  function showLocation(pc, follow = false) {
    currentPC = pc;
    const location = locations.get(pc);
    if (follow && location) showDocument(location.doc);
    if (marker && (marker.location !== location || marker.location.doc !== editor.getDoc())) {
      marker.location.doc.removeLineClass(marker.handle, 'background', 'execution-line');
      marker = null;
    }
    if (location && location.doc === editor.getDoc()) {
      if (!marker) {
        const handle = location.doc.addLineClass(location.line, 'background', 'execution-line');
        marker = { location, handle };
      }
      if (follow) editor.scrollIntoView({ line: location.line, ch: 0 }, 32);
    }
    return Boolean(location);
  }
  editorEl.showExecutionAt = showLocation;
  editorEl.hasExecutionLines = () => locations.size > 0;
  editorEl.setExecutionLines = (build) => {
    showLocation(null);
    showDocument(entry);
    locations.clear();
    addresses.clear();
    activeSources = new Map();
    sourceNav.replaceChildren();
    sourceNav.hidden = true;
    if (!build) return;
    activeSources.set(build.fileName, entry);
    for (const [pc, { file, line }] of build.sourceLines) {
      let doc = activeSources.get(file);
      if (!doc) {
        const text = build.sources.get(file);
        doc = includes.get(file);
        if (!doc || doc.getValue() !== text) {
          for (const [handle, owner] of breakpoints) if (owner === doc) breakpoints.delete(handle);
          doc = new CodeMirror.Doc(text, 'z80-playground');
          includes.set(file, doc);
        }
        activeSources.set(file, doc);
      }
      if (line >= doc.lineCount()) continue;
      locations.set(pc, { doc, line });
      if (!addresses.has(doc)) addresses.set(doc, new Map());
      const byLine = addresses.get(doc);
      if (!byLine.has(line)) byLine.set(line, pc);
    }
    if (activeSources.size < 2) return;
    for (const [file, doc] of activeSources) {
      const button = document.createElement('button');
      button.value = file;
      button.textContent = file.split('/').pop();
      button.title = doc === entry ? 'Example source' : file.replace(/^files\//, '');
      button.setAttribute('aria-pressed', String(doc === entry));
      button.addEventListener('click', () => {
        showDocument(doc);
        showLocation(currentPC);
      });
      sourceNav.append(button);
    }
    sourceNav.hidden = false;
  };

  editorEl.previewSource = path => {
    const doc = activeSources.get('files/' + path) || activeSources.get(path) ||
      (path === editorEl.filePath && activeSources.size ? entry : null);
    if (!doc) return false;
    showDocument(doc);
    showLocation(currentPC);
    return true;
  };

  function breakpointAddress(doc, line) {
    const byLine = addresses.get(doc);
    if (!byLine) return;
    for (; line < doc.lineCount(); line++) {
      if (byLine.has(line)) return byLine.get(line);
      const text = doc.getLine(line).split(';', 1)[0].trim();
      if (text && !/^[\w.$]+:$/.test(text)) return;
    }
  }
  editorEl.breakpointAddresses = () => {
    const wanted = new Set();
    for (const [handle, doc] of breakpoints) {
      const line = doc.getLineNumber(handle);
      if (line === null) {
        breakpoints.delete(handle);
        continue;
      }
      const address = breakpointAddress(doc, line);
      if (address !== undefined) wanted.add(address);
      if (installed.has(address)) doc.addLineClass(handle, 'gutter', 'breakpoint-bound');
      else doc.removeLineClass(handle, 'gutter', 'breakpoint-bound');
    }
    return wanted;
  };
  editorEl.reflectBreakpoints = (nativeAddresses) => {
    installed = nativeAddresses;
    editorEl.breakpointAddresses();
  };
  function toggleBreakpoint(line) {
    const doc = editor.getDoc();
    const handle = doc.getLineHandle(line);
    if (breakpoints.delete(handle)) {
      doc.removeLineClass(handle, 'gutter', 'source-breakpoint');
      doc.removeLineClass(handle, 'gutter', 'breakpoint-bound');
    } else {
      if (!doc.getLine(line).split(';', 1)[0].trim()) return;
      breakpoints.set(handle, doc);
      doc.addLineClass(handle, 'gutter', 'source-breakpoint');
    }
    editorEl.dispatchEvent(new Event('breakpoints-changed'));
  }
  editor.on('gutterClick', (cm, line, gutter) => {
    if (gutter === 'CodeMirror-linenumbers') toggleBreakpoint(line);
  });
  editor.addKeyMap({ F9: () => toggleBreakpoint(editor.getCursor().line) });

  editor.on('change', () => {
    const hadMap = locations.size > 0;
    editorEl.setExecutionLines(null);
    if (hadMap) editorEl.dispatchEvent(new Event('breakpoints-changed'));
    if (!isDirty) {
      isDirty = true;
      fileName.textContent = `* ${editor.fileName}`;
      fileName.classList.add('info');
    }
  });

  editorEl.gotoLine = (line, opts = {}) => {
    showDocument(entry);
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
      entry.setGutterMarker(line, 'CodeMirror-linenumbers', el);
      entry.addLineClass(line, 'background', `cm-error`);
    } else {
      entry.removeLineClass(line, 'background', 'cm-error');
      entry.setGutterMarker(line, 'CodeMirror-linenumbers', null);
    }
  };

  editorEl.clearErrors = () => {
    const lineCount = entry.lineCount();
    for (let line = 0; line < lineCount; line++) {
      entry.removeLineClass(line, 'background', 'cm-error');
      entry.setGutterMarker(line, 'CodeMirror-linenumbers', null);
    }
  };

  editorEl.gotoLabel = (label, highlight = false) => {
    showDocument(entry);
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

  editorEl.openFile = (o) => {
    showDocument(entry);
    for (const [handle, doc] of breakpoints) {
      doc.removeLineClass(handle, 'gutter', 'source-breakpoint');
      doc.removeLineClass(handle, 'gutter', 'breakpoint-bound');
    }
    breakpoints.clear();
    includes.clear();
    editor.setValue(o.text);
    isDirty = false;

    editor.fileName = o.name;
    editorEl.fileName = o.name ?? null;
    editor.filePath = o.path;
    editorEl.filePath = o.path ?? null;
    fileName.textContent = o.name ?? '* new file';
    if (o.name) {
      fileName.classList.remove('info');
    }

    const reUses = /^\s*;\s+@uses\s+(\S+)\s*$/m;
    const mUses = o.text.match(reUses);
    if (mUses) {
      switch (mUses[1]) {
        case 'zealos':
          emulator.uses = 'zealos';
          break;
      }
    } else {
      emulator.uses = null;
    }

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

  editorEl.getValue = () => entry.getValue();

  function saveFile() {
    if (editor.getDoc() !== entry) return;
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
    isDirty = false;
    editor.fileName = name;
    editorEl.fileName = name;
    editorEl.filePath = `user/${editor.fileName}`;
    fileName.textContent = editor.fileName;
    fileName.classList.remove('info');
  }
  editorEl.saveFile = saveFile;

  bSaveFile.addEventListener('click', () => {
    saveFile();
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
