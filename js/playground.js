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
const splitter = document.querySelector('.resize-column');
const workspace = document.getElementById('workspace');
const narrowScreen = matchMedia('(max-width: 699px)');
explorer.open = !narrowScreen.matches;
narrowScreen.addEventListener('change', (event) => { explorer.open = !event.matches; });

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
  if (editor.previewSource(o.path)) return;
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

const themeSelect = document.getElementById('theme');
themeSelect.value = localStorage.getItem('playground-theme') === 'light' ? 'light' : 'dark';
document.documentElement.dataset.theme = themeSelect.value;
themeSelect.addEventListener('change', () => {
  document.documentElement.dataset.theme = themeSelect.value;
  localStorage.setItem('playground-theme', themeSelect.value);
});

const runStop = document.getElementById('run-stop');

function updateRunStop() {
  const running = emulator.running;
  runStop.querySelector('span').textContent = running ? 'Stop' : 'Run';
  runStop.querySelector('i').className = running ? 'fa-solid fa-stop' : 'fa-solid fa-play';
}

emulator.addEventListener('session-ended', updateRunStop);
runStop.addEventListener('click', async () => {
  runStop.disabled = true;
  try {
    if (emulator.running) {
      if (await emulator.stop()) editor.classList.add('expand');
    } else {
      const build = await assemble();
      if (!build) return;
      editor.classList.remove('expand');
      await emulator.reload(build);
    }
  } finally {
    updateRunStop();
    runStop.disabled = false;
  }
});

async function download_binary() {
  const build = await assemble();
  if (!build) return;
  const data = build.bin;
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

// CSS clamps stored widths to the space available on the current screen.
const savedWidth = Number.parseFloat(localStorage.getItem('container-layout'));
if (Number.isFinite(savedWidth)) viewport.style.setProperty('--editor-width', savedWidth + 'px');

function resizeEditor(width) {
  width = Math.round(Math.max(360, Math.min(workspace.clientWidth - 328, width)));
  viewport.style.setProperty('--editor-width', width + 'px');
  localStorage.setItem('container-layout', width);
}

let grabOffset = 0;
splitter.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  grabOffset = event.clientX - splitter.getBoundingClientRect().left;
  splitter.setPointerCapture(event.pointerId);
  event.preventDefault();
});
splitter.addEventListener('pointermove', (event) => {
  if (splitter.hasPointerCapture(event.pointerId)) {
    resizeEditor(event.clientX - workspace.getBoundingClientRect().left - grabOffset);
  }
});
splitter.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home') resizeEditor(360);
  else if (event.key === 'End') resizeEditor(workspace.clientWidth);
  else resizeEditor(editor.clientWidth + (event.key === 'ArrowRight' ? 24 : -24));
});

new ResizeObserver(() => {
  splitter.setAttribute('aria-valuenow', Math.round(100 * editor.clientWidth / workspace.clientWidth));
  editor.editor?.refresh();
}).observe(editor);
