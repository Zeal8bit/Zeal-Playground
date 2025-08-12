(() => {
  /* Do not modify this line, it is auto-generated */
  const BUILTIN_FILES = [];

  const explorer = document.getElementById('explorer');
  const bNewFile = document.querySelector('.new-file');
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

  async function openRemoteFile(name, path) {
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

  async function openLocalFile(name, path) {
    const item = localStorage.getItem(`file:${name}`);
    if (!item) return; // oops
    const o = JSON.parse(item);
    return Promise.resolve(o.text);
  }

  function openFile(name, path) {
    console.log('open file', name, path);

    let file;
    if (path.startsWith('user/')) {
      // load from local storage
      file = openLocalFile(name, path);
    } else {
      file = openRemoteFile(name, path);
    }
    file.then((text) => {
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
    });
  }
  explorer.openFile = openFile;

  function addFile(name, path) {
    const a = document.createElement('a');
    a.classList.add('file-item');
    const i = document.createElement('icon');
    i.classList.add('fa-solid', 'fa-file-code');
    a.appendChild(document.createTextNode(name));

    a.addEventListener('click', (e) => openFile(name, path));
    return a;
  }

  function addFolder(name, objects) {
    const { files, ...folders } = objects;

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
    details.appendChild(summary);
    details.addEventListener('toggle', toggleFolder);

    const children = document.createElement('div');
    children.classList.add('files');
    details.appendChild(children);

    for (const folder of keySort(folders)) {
      children.appendChild(addFolder(folder, folders[folder]));
    }

    if (files?.length) {
      const list = document.createElement('div');
      list.classList.add('file-list');

      for (const o of files.sort((a, b) => a.name.localeCompare(b.name))) {
        const { name, path } = o;
        list.appendChild(addFile(name, path));
      }
      children.append(list);
    }

    return details;
  }

  function renderTree(tree, insertBefore = false) {
    console.log(tree);
    for (let folder of keySort(tree)) {
      console.log('root folder', folder);
      const fileList = explorer.querySelector(':scope .contents > .files');
      const details = addFolder(folder, tree[folder]);

      if (insertBefore) {
        fileList.insertBefore(details, fileList.firstChild);
      } else {
        fileList.appendChild(details);
      }
    }
  }

  function refreshUser() {
    console.log('refreshUser');
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
    renderTree(userFiles, true);
  }

  explorer.refreshUser = refreshUser;
  refreshUser();

  const builtInFiles = buildFileTree(BUILTIN_FILES);
  [builtInFiles].forEach((tree) => renderTree(tree));
})();
