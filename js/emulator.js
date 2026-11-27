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

  const output = emulator.querySelector('.output');
  const inspector = createDebuggerInspector(document.getElementById('debugger'));
  const runtimeOutput = document.getElementById('runtime-output');
  const canvas = emulator.querySelector('canvas');

  const enableZealOS = document.querySelector('input[name=enable_zealos]');

  let instance = null;
  Object.defineProperty(emulator, 'running', { get: () => Boolean(instance?.module) });
  let operation = Promise.resolve();
  // Each tab runs disposable images independently.
  const storageNamespace = crypto.randomUUID?.();

  function transition(action) {
    operation = operation.then(action).then(() => true).catch(error => {
      runtimeOutput.open = true;
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
    inspector.attach(null);
    if (instance) await instance.exit();
    instance = null;
  }

  emulator.reload = (data) => {
    const withOS = uses === 'zealos';
    const basename = (editor.fileName || 'main.asm').split('/').pop().replace(/\.[^.]*$/, '');
    return transition(async () => {
      await stopInstance();
      output.replaceChildren();
      runtimeOutput.open = false;
      instance = new ZealNative({
        canvas,
        debugger: true,
        imageStorage: 'memory',
        storageNamespace,
        romdisk: withOS ? 'wasm/native/zealos.img' : data,
        userProgram: withOS ? data : null,
        userProgramPath: `/roms/${basename}.bin`,
        onExit() {
          inspector.attach(null);
          emulator.dispatchEvent(new Event('session-ended'));
        },
        print: log('info'),
        printErr: log('error'),
      });
      await instance.start();
      await instance.debugger.continue();
      inspector.attach(instance.debugger);
    });
  };

  emulator.stop = () => transition(stopInstance);
})();
