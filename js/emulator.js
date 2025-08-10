(() => {
  /* WebASM related */
  const canvas = document.getElementById('canvas');
  let instance = null;

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

    Module(defaultModule).then((mod) => (instance = mod));
  };

  emulator.stop = () => {
    console.log('stop emulator');
    if (instance) {
      instance._zeal_exit();
    }
    instance = null;
  };
})();
