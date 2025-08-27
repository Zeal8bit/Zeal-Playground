const DEFAULT_CODE = `\t; Includes a tiny bootloader that sets up memory mapping and clears VRAM` +
  `\n\t.include "examples/launcher.asm"` +
  `\n\n\t; Define your main routine here - the bootloader has already:` +
  `\n\t; - Configured MMU for ROM, VRAM, and RAM access` +
  `\n\t; - Cleared the VRAM (video memory)` +
  `\n\t; - Set stack pointer to 0xffff` +
  `\n\t; Check "launcher.asm" file for more details.` +
  `\nmain:` +
  `\n\t\t; Write your code here` +
  `\n\t\tret` +
  `\n`;

const viewport = document.getElementById('viewport');
// const container = document.getElementById('top-panel');
const editor = document.getElementById('editor');
const explorer = document.getElementById('explorer');
const emulator = document.getElementById('emulator');
const editorResizers = document.querySelectorAll('.resize-column');

function prefs_reset_layout() {
  console.log('prefs', 'reset layout');
  localStorage.removeItem('container-layout');
  viewport.style.removeProperty('--editor-width');
}

function handleUrlHash() {
  const hash = location.hash?.replace('#', '').trim();
  if (!hash) return;
  const [c, v] = [hash.substring(0, 1), hash.substring(1)];
  switch (c.toLowerCase()) {
    case 'n':
      editor.gotoLine(parseInt(v) - 1, true);
      break;
    case 'l':
      editor.gotoLabel(v);
      break;
  }
}

function handleUrlParams() {
  const url = new URL(document.location.href);
  const file = url.searchParams.get('f') || 'examples/hello.asm';
  explorer.openFile(file).then((o) => handleUrlHash());
}

window.addEventListener('keydown', (e) => {
  const save = (e.ctrlKey || e.metaKey) && e.key === 's';
  if (save) {
    e.preventDefault();
    editor.saveFile();
  }
});

window.addEventListener('load', async () => {
  handleUrlParams();
  await explorer.fetchManifest();

  document.body.classList.remove('loading');
  setTimeout(() => editor.editor.focus(), 200);
});

window.addEventListener('hashchange', handleUrlHash);

window.addEventListener('popstate', (e) => {
  if (e.state) {
    editor.openFile(e.state);
  }
});

explorer.addEventListener('open-file', (e) => {
  const o = e.detail;
  const url = new URL(window.location);
  url.searchParams.set('f', o.path);
  window.history.pushState(o, '', url);
  editor.openFile(o);
});

explorer.addEventListener('new-file', (e) => {
  editor.openFile({
    name: undefined,
    text: DEFAULT_CODE,
  });
});

editor.addEventListener('file-saved', (e) => {
  explorer.refreshUser();
});

async function code_run() {
  const bytes = await assemble();
  console.log(bytes);
  /* If we have some bytes, load them to the VFS */
  const data = new Uint8Array(bytes);

  emulator.reload(data);
  editor.classList.remove('expand');
}

async function code_stop() {
  emulator.stop();
  editor.classList.add('expand');
}

async function download_binary() {
  const bytes = await assemble();
  const data = new Uint8Array(bytes);
  const blob = new Blob([data], { type: 'application/octen-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const fileName = editor.fileName.split('/').slice(-1).join('').split('.').slice(0, -1).join('.') + '.bin';
  a.download = fileName;
  document.body.append(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Resize Handler
 */
(() => {
  let window_width = window.innerWidth;
  let resizing = false;
  let col1w_start, col2w_start;
  let startX;
  const minWidth = 320;

  function setColumns(col1, col2) {
    viewport.style.setProperty('--editor-width', `${col1}px`);
    localStorage.setItem('container-layout', col1);
  }

  window.addEventListener('resize', (e) => {
    if (window.innerWidth < window_width) {
      console.log('shrinking...');
    }
    window_width = window.innerWidth;
  });

  window.addEventListener('load', (e) => {
    const containerLayout = localStorage.getItem('container-layout');
    if (containerLayout && containerLayout.trim().length) {
      [col1w_start, col2w_start] = containerLayout.split(' ');
      setColumns(col1w_start, col2w_start);
    }
  });

  editorResizers.forEach((resizer) =>
    resizer.addEventListener('mousedown', (e) => {
      resizing = true;
      startX = e.clientX;

      const styles = window.getComputedStyle(viewport);
      const cols = styles.gridTemplateColumns.split(' ');
      col1w_start = parseFloat(cols[2]);
      col2w_start = parseFloat(cols[4]);
    }),
  );

  document.addEventListener('mouseup', (e) => {
    resizing = false;
  });
  document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - startX;

    let col1w_new = col1w_start + dx;
    let col2w_new = col2w_start - dx;

    if (col1w_new < minWidth) {
      col2w_new -= minWidth - col1w_new;
      col1w_new = minWidth;
    }
    if (col2w_new < minWidth) {
      col1w_new -= minWidth - col2w_new;
      col2w_new = minWidth;
    }

    setColumns(col1w_new, col2w_new);
  });
})();
