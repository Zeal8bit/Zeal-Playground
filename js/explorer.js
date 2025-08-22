(() => {
  const explorer = document.getElementById('explorer');
  const bNewFile = document.querySelector('.new-file');
  const fileList = explorer.querySelector(':scope .contents > .files');
  bNewFile.addEventListener('click', () => {
    const e = new CustomEvent('new-file', {
      detail: {},
      bubbles: true,
      cancelable: true,
    });
    explorer.dispatchEvent(e);
  });

  function keySort(o) {
    return Object.keys(o).sort((a, b) => a.localeCompare(b));
  }

  function toggleFolder(e) {
    const details = e.currentTarget;
    const icon = details.querySelector('.fa-solid'); // use a better identifier?
    if (details.open) {
      icon.classList.remove('fa-folder');
      icon.classList.add('fa-folder-open');
    } else {
      icon.classList.remove('fa-folder-open');
      icon.classList.add('fa-folder');
    }
  }

  function buildFileTree(files) {
    const tree = {};

    files.forEach((filePath) => {
      const parts = filePath.split('/');

      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        const isFile = i === parts.length - 1;

        if (isFile) {
          // At file level: push the file object into an array in the current folder
          if (!current.files) current.files = [];

          current.files.push({
            path: filePath,
            name: part,
          });
        } else {
          // At folder level: create nested object if needed
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
    });

    return tree;
  }

  async function openRemoteFile(path) {
    return fetch(`files/${path}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ERROR: Failed to open ${name} from ${path} [${response.status}]`);
        }
        return response.text();
      })
      .catch((err) => {
        console.log('Failed to fetch file:', err);
      });
  }

  async function openLocalFile(path) {
    let name = path.split('/').slice(1).join('/');
    const item = localStorage.getItem(`file:${name}`);
    if (!item) return; // oops
    const o = JSON.parse(item);
    return Promise.resolve(o.text);
  }

  async function readFile(path) {
    let file;
    let name = path.split('/').slice(-1)[0] || undefined;
    let text = '';
    if (path.match(/^\/?user\//)) {
      // load from local storage
      text = await openLocalFile(path);
    } else {
      text = await openRemoteFile(path);
    }
    return Promise.resolve({
      path,
      name,
      text,
    });
  }
  explorer.readFile = readFile;

  function openFile(path) {
    return readFile(path).then(({ name, path, text }) => {
      const e = new CustomEvent('open-file', {
        detail: {
          name,
          path,
          text,
        },
        bubbles: true,
        cancelable: true,
      });
      explorer.dispatchEvent(e);
      return e.detail;
    });
  }
  explorer.openFile = openFile;

  function listFiles(path) {
    const files = Array.from(fileList.querySelectorAll('.file-item')).map((file) => {
      return file.getAttribute('path');
    });
    return files;
  }
  explorer.listFiles = listFiles;

  function deleteFile(path) {
    let name = path.split('/').slice(1).join('/');
    localStorage.removeItem(`file:${name}`);
    refreshUser();
    return true;
  }
  explorer.deleteFile = deleteFile;

  function addFile(name, path, options = {}) {
    const { writable = false } = options;

    const a = document.createElement('a');
    a.setAttribute('path', path);
    a.classList.add('file-item');
    const i = document.createElement('icon');
    i.classList.add('fa-solid', 'fa-file-code');
    a.appendChild(document.createTextNode(name));
    a.addEventListener('click', (e) => openFile(path));

    if (writable) {
      const del = document.createElement('icon');
      del.classList.add('fa-solid', 'fa-trash', 'control');
      a.appendChild(del);

      del.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteFile(path);
      });
    }
    return a;
  }

  function addFolder(name, path, objects, options = {}) {
    const { files, ...folders } = objects;
    const { writable = false } = options;

    // <details open>
    //   <summary class="file-item">
    //     <icon class="fa-solid fa-folder"></icon>
    //     examples
    //   </summary>
    //   <div class="file-list">
    //     <a class="file-item"><icon class="fa-solid fa-file-code"></icon> hello.asm</a>
    //     <a class="file-item"><icon class="fa-solid fa-file-code"></icon> example2.asm</a>
    //     <a class="file-item"><icon class="fa-solid fa-file-code"></icon> example3.asm</a>
    //     <a class="file-item"><icon class="fa-solid fa-file-code"></icon> example4.asm</a>
    //   </div>
    // </details>

    const details = document.createElement('details');
    details.open = true;
    details.id = `folder-${name}`;

    const summary = document.createElement('summary');
    summary.classList.add('file-item');
    const icon = document.createElement('icon');
    icon.classList.add('fa-solid', 'fa-folder');
    summary.appendChild(icon);
    summary.appendChild(document.createTextNode(name));
    summary.setAttribute('path', `${path}/`);
    details.appendChild(summary);
    details.addEventListener('toggle', toggleFolder);

    const children = document.createElement('div');
    children.classList.add('files');
    details.appendChild(children);

    for (const folder of keySort(folders)) {
      children.appendChild(addFolder(folder, `${path}/${folder}`, folders[folder], options));
    }

    if (files?.length) {
      const list = document.createElement('div');
      list.classList.add('file-list');

      for (const o of files.sort((a, b) => a.name.localeCompare(b.name))) {
        const { name, path } = o;
        list.appendChild(addFile(name, path, options));
      }
      children.append(list);
    }

    return details;
  }

  function renderTree(tree, options = {}) {
    const { insertBefore = false } = options;
    for (let folder of keySort(tree)) {
      const details = addFolder(folder, folder, tree[folder], options);

      if (insertBefore) {
        fileList.insertBefore(details, fileList.firstChild);
      } else {
        fileList.appendChild(details);
      }
    }
  }

  function refreshUser() {
    const USER_FILES = (() => {
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('file:')) {
          const o = JSON.parse(localStorage.getItem(key));
          entries.push(o.path);
        }
      }
      return entries;
    })();
    const userFiles = buildFileTree(USER_FILES);
    explorer.querySelector('#folder-user')?.remove();
    renderTree(userFiles, {
      insertBefore: true,
      writable: true,
    });
  }

  explorer.refreshUser = refreshUser;
  refreshUser();

  explorer.fetchManifest = () => {
    return fetch('files/manifest.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('ERROR: Failed to open files/manifest.json');
        }
        return response.json();
      })
      .then((manifest) => {
        console.log('manifest', manifest);
        if (manifest?.files?.length) {
          const tree = buildFileTree(manifest.files);
          if (tree) renderTree(tree);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch file:', err);
      });
  };

  /**
   * Resize Handler
   */

  const onResize = (e) => {
    const height = explorer.clientHeight - fileList.offsetTop;
    fileList.style.setProperty('--max-h', `${height}px`);
  };
  window.addEventListener('resize', onResize);
  onResize();
})();
