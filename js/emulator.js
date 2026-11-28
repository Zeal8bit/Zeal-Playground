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

  // Keep native breakpoint changes ordered, including clicks made while an
  // earlier request is waiting for the emulator's next frame.
  let binding = null;
  function syncBreakpoints() {
    const owner = binding;
    if (!owner) return Promise.resolve();
    owner.pending = owner.pending.catch(() => {}).then(async () => {
      if (binding !== owner) return;
      const wanted = editor.breakpointAddresses();
      try {
        for (const address of owner.installed) {
          if (!wanted.has(address)) {
            await owner.session.removeBreakpoint(address);
            owner.installed.delete(address);
          }
        }
        for (const address of wanted) {
          if (!owner.installed.has(address)) {
            await owner.session.setBreakpoint(address);
            owner.installed.add(address);
          }
        }
      } finally {
        if (binding === owner) editor.reflectBreakpoints(owner.installed);
      }
    });
    return owner.pending;
  }
  editor.addEventListener('breakpoints-changed', () => {
    syncBreakpoints().catch(error => {
      runtimeOutput.open = true;
      log('error')(error.message);
    });
  });
  function unbindBreakpoints() {
    binding = null;
    editor.reflectBreakpoints(new Set());
  }

  async function stopInstance() {
    const pending = binding?.pending;
    unbindBreakpoints();
    await pending?.catch(() => {});
    editor.setExecutionLines(null);
    inspector.attach(null);
    if (instance) await instance.exit();
    instance = null;
  }

  emulator.reload = (build) => {
    const { bin, fileName, withOS, generation } = build;
    const startPaused = document.querySelector('[name=start_paused]').checked;
    const basename = fileName.split('/').pop().replace(/\.[^.]*$/, '');
    return transition(async () => {
      await stopInstance();
      output.replaceChildren();
      runtimeOutput.open = false;
      instance = new ZealNative({
        canvas,
        debugger: true,
        previewOnPause: true,
        imageStorage: 'memory',
        storageNamespace,
        romdisk: withOS ? 'wasm/native/zealos.img' : bin,
        userProgram: withOS ? bin : null,
        userProgramPath: `/roms/${basename}.bin`,
        onExit() {
          unbindBreakpoints();
          editor.setExecutionLines(null);
          inspector.attach(null);
          emulator.dispatchEvent(new Event('session-ended'));
        },
        print: log('info'),
        printErr: log('error'),
      });
      await instance.start();
      if (editor.entryDoc.isClean(generation)) editor.setExecutionLines(build);
      binding = { session: instance.debugger, installed: new Set(), pending: Promise.resolve() };
      try {
        await syncBreakpoints();
        if (!startPaused) await instance.debugger.continue();
      } finally {
        inspector.attach(instance.debugger);
      }
    });
  };

  emulator.stop = () => transition(stopInstance);
})();
