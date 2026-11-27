(() => {
  /* WebASM related */
  const emulator = document.getElementById('emulator');
  let uses;
  Object.defineProperty(emulator, 'uses', {
    get() {
      return uses;
    },
    set(v) {
      uses = v;
      enableZealOS.checked = uses == 'zealos';
    },
  });

  const controls = emulator.querySelector('.controls');
  const output = emulator.querySelector('.output');
  const canvas = emulator.querySelector('canvas');

  const enableZealOS = document.querySelector('input[name=enable_zealos]');

  let instance = null;
  let operation = Promise.resolve();
  // Each tab runs disposable images independently.
  const storageNamespace = crypto.randomUUID?.();

  function transition(action) {
    operation = operation.then(action).then(() => true).catch(error => {
      controls.classList.remove('hidden');
      output.classList.remove('hidden');
      log('error')(error.message);
      return false;
    });
    return operation;
  }

  canvas.addEventListener('keydown', (e) => {
    /* Prevent the window from listening on events that are meant to be sent to the VM */
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  });

  canvas.addEventListener('wheel', (e) => {
    emulator.scrollLeft += e.deltaX;
    emulator.scrollTop += e.deltaY;
  });

  const bToggleFPS = emulator.querySelector('.toggle-fps');
  function setToggleFPS(show_fps) {
    if (show_fps) {
      bToggleFPS.textContent = 'Hide FPS';
    } else {
      bToggleFPS.textContent = 'Show FPS';
    }
  }

  bToggleFPS?.addEventListener('click', () => {
    if (instance?.runtimeReady && instance.toggleFps()) {
      const show_fps = Boolean(instance.module.getValue(instance.module._show_fps, 'i8'));
      setToggleFPS(show_fps);
      localStorage.setItem('show_fps', show_fps ? 1 : 0);
    }
  });

  function log(prefix = '') {
    return (text, ...args) => {
      console.log(prefix, text, ...args);
      const line = document.createElement('div');
      line.classList.add('log-line', prefix);
      line.textContent = text + (args ? ' ' + args.join(' ') : '');
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };
  }

  enableZealOS.addEventListener('change', (e) => {
    uses = e.target.checked ? 'zealos' : '';
  });

  async function stopInstance() {
    if (instance) await instance.exit();
    instance = null;
    controls.classList.add('hidden');
  }

  emulator.reload = (data) => {
    const withOS = uses === 'zealos';
    const basename = (editor.fileName || 'main.asm').split('/').pop().replace(/\.[^.]*$/, '');
    return transition(async () => {
      await stopInstance();
      output.replaceChildren();
      output.classList.remove('hidden');
      instance = new ZealNative({
        canvas,
        imageStorage: 'memory',
        storageNamespace,
        romdisk: withOS ? 'wasm/native/zealos.img' : data,
        userProgram: withOS ? data : null,
        userProgramPath: `/roms/${basename}.bin`,
        print: log('info'),
        printErr: log('error'),
      });
      const mod = await instance.start();
      const showFPS = localStorage.getItem('show_fps') === '1';
      mod.setValue(mod._show_fps, Number(showFPS), 'i8');
      setToggleFPS(showFPS);
      controls.classList.remove('hidden');
    });
  };

  emulator.stop = () => transition(async () => {
    await stopInstance();
    output.classList.add('hidden');
  });
})();
