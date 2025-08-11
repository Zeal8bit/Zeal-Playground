(() => {
  /* WebASM related */
  const emulator = document.getElementById('emulator');
  const controls = emulator.querySelector('.controls');
  const canvas = document.getElementById('canvas');
  let instance = null;

  const bToggleFPS = emulator.querySelector('.toggle-fps');
  function setToggleFPS(show_fps) {
    if (show_fps) {
      bToggleFPS.textContent = 'Hide FPS';
    } else {
      bToggleFPS.textContent = 'Show FPS';
    }
  }
  bToggleFPS?.addEventListener('click', () => {
    console.log('toggle-fps');
    if (instance) {
      const show_fps = !!!instance.getValue(instance._show_fps, 'i8');
      instance.setValue(instance._show_fps, show_fps ? 1 : 0, 'i8');
      setToggleFPS(show_fps);
      localStorage.setItem('show_fps', show_fps ? 1 : 0);
    }
  });

  canvas.addEventListener('click', () => {
    canvas.focus();
    enableRaylibInput();
  });

  canvas.addEventListener('blur', () => {
    disableRaylibKeyboard();
  });

  let savedKeyCallback = null;
  let savedCharCallback = null;

  function disableRaylibKeyboard() {
    if (typeof GLFW === 'undefined' || !GLFW.active) return;
    console.log('disableRaylibKeyboard');

    /* Get the GLFW window */
    const id = GLFW.active.id;
    savedKeyCallback = GLFW.active.keyFunc;
    savedCharCallback = GLFW.active.charFunc;
    GLFW.setKeyCallback(id, null); // disables keyboard input
    GLFW.setCharCallback(id, null); // disables text input
  }

  function enableRaylibInput() {
    if (typeof GLFW === 'undefined' || !GLFW.active) return;
    console.log('enableRaylibInput');
    const id = GLFW.active.id;
    GLFW.setKeyCallback(id, savedKeyCallback);
    GLFW.setCharCallback(id, savedCharCallback);
  }

  emulator.reload = (data) => {
    console.log('reloadEmulator', data);

    if (instance) {
      instance._zeal_exit();
      instance = null;
      setTimeout(() => {
        emulator.reload(data);
      }, 100);
      return;
    }

    const defaultModule = {
      print: function (text) {
        console.log('Log: ' + text);
      },
      printErr: function (text) {
        console.warn('Error: ' + text);
      },
      canvas: (function () {
        return canvas;
      })(),
      postRun: function () {
        disableRaylibKeyboard();
      },
      onRuntimeInitialized: function () {
        this.FS.writeFile('/roms/default.img', data);
      },
    };
    // Module.noInitialRun = true;
    // Module.noExitRuntime = true;
    // Module.dontCaptureKeyboard = true;

    Module(defaultModule).then((mod) => {
      instance = mod;

      const show_fps = parseInt(localStorage.getItem('show_fps'));
      console.log('show_fps', show_fps);
      instance.setValue(instance._show_fps, show_fps, 'i8');
      setToggleFPS(show_fps);
      controls.classList.remove('hidden');
    });
  };

  emulator.stop = () => {
    console.log('stop emulator');
    if (instance) {
      instance._zeal_exit();
    }
    instance = null;
    controls.classList.add('hidden');
  };
})();
