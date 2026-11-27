function createDebuggerInspector(panel) {
  const status = panel.querySelector('#cpu-state');
  const toolbar = document.querySelector('#emulator .debug-controls');
  const buttons = toolbar.querySelectorAll('[data-command]');
  const tabs = Array.from(panel.querySelectorAll('[role=tab]'));
  let activeTab = tabs[0];
  const memoryForm = panel.querySelector('#memory-location');
  const addressInput = panel.querySelector('#memory-address');
  const registers = panel.querySelector('#cpu-registers');
  const stackValues = panel.querySelector('#stack-values');
  const memoryValues = panel.querySelector('#memory-values');
  const error = panel.querySelector('#debug-error');
  let session = null;
  let commandPending = false;
  let address = 0;
  let timer;
  let revision = 0;

  const hex = (number, width = 4) => number.toString(16).toUpperCase().padStart(width, '0');
  const registerCells = new Map();
  for (const name of ['PC', 'SP', 'AF', 'BC', 'DE', 'HL', 'IX', 'IY', 'AF′', 'BC′', 'DE′', 'HL′', 'I', 'R']) {
    const label = document.createElement('dt');
    const value = document.createElement('dd');
    label.textContent = name;
    registers.append(label, value);
    registerCells.set(name, value);
  }

  function display(sample) {
    const r = sample.registers;
    if (activeTab.id === 'cpu-tab') {
      const cpu = { PC: r.pc, SP: r.sp, AF: r.a << 8 | r.f, BC: r.b << 8 | r.c, DE: r.d << 8 | r.e,
        HL: r.h << 8 | r.l, IX: r.ix, IY: r.iy, 'AF′': r.afAlt, 'BC′': r.bcAlt,
        'DE′': r.deAlt, 'HL′': r.hlAlt, I: r.i, R: r.r };
      for (const [name, cell] of registerCells) cell.textContent = hex(cpu[name], name.length === 1 ? 2 : 4);
      return;
    }

    const rows = [];
    if (activeTab.id === 'stack-tab') {
      for (let i = 0; i < sample.stack.length; i += 2) {
        rows.push(hex(r.sp + i) + '   ' + hex(sample.stack[i] | sample.stack[i + 1] << 8));
      }
      stackValues.textContent = rows.length ? 'Addr   Word\n' + rows.join('\n') : 'No complete word at SP $' + hex(r.sp);
    } else {
      const bytes = sample.memory.bytes;
      for (let i = 0; i < bytes.length; i += 8) {
        rows.push(hex(address + i) + '   ' + Array.from(bytes.subarray(i, i + 8), byte => hex(byte, 2)).join(' '));
      }
      memoryValues.textContent = rows.join('\n');
    }
  }

  function refresh() {
    clearTimeout(timer);
    const request = ++revision;
    const state = session?.state;
    panel.hidden = toolbar.hidden = !state;
    if (!state) return;
    if (state.paused) editor.showExecutionAt(state.registers.pc, true);
    status.textContent = state.reason === 'breakpoint' ? 'Paused at breakpoint' : state.paused ? 'Paused' : 'Running';
    for (const button of buttons) {
      const command = button.dataset.command;
      button.hidden = command === (state.paused ? 'pause' : 'continue');
      button.disabled = commandPending || (!state.paused && ['step', 'stepOver'].includes(command));
    }
    if (commandPending || document.hidden) return;
    if (!panel.open && (state.paused || !editor.hasExecutionLines())) return;
    const memory = panel.open && activeTab.id === 'memory-tab';
    session.sample(address, memory ? Math.min(64, 0x10000 - address) : 0).then(sample => {
      if (request !== revision) return;
      if (!state.paused) editor.showExecutionAt(sample.registers.pc);
      if (panel.open) display(sample);
      if (!state.paused) timer = setTimeout(refresh, 750);
    }).catch(cause => {
      if (request === revision) error.textContent = cause.message;
    });
  }

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const current = session;
      if (!current || commandPending) return;
      commandPending = true;
      error.textContent = '';
      refresh();
      try {
        await current[button.dataset.command]();
      } catch (cause) {
        if (session === current) error.textContent = cause.message;
      } finally {
        if (session === current) {
          commandPending = false;
          refresh();
        }
      }
    });
  }

  memoryForm.addEventListener('submit', event => {
    event.preventDefault();
    address = Number.parseInt(addressInput.value.replace(/^\$/, ''), 16);
    addressInput.value = hex(address);
    refresh();
  });
  function selectTab(next) {
    activeTab = next;
    for (const tab of tabs) {
      const selected = tab === next;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    }
    refresh();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const index = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (index === undefined) return;
      event.preventDefault();
      const next = tabs[(index + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  panel.addEventListener('toggle', refresh);
  document.addEventListener('visibilitychange', refresh);

  return {
    attach(next) {
      session?.removeEventListener('statechange', refresh);
      session = next;
      commandPending = false;
      error.textContent = '';
      stackValues.textContent = memoryValues.textContent = '';
      for (const cell of registerCells.values()) cell.textContent = '—';
      session?.addEventListener('statechange', refresh);
      refresh();
    },
  };
}
