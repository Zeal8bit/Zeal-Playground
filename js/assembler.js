function get_bytes(obj) {
  var bytes = [];
  var pc = -1;
  obj.dump.forEach(function (entry) {
    if (!entry.lens) return;
    /* Initialize the PC if not initialized yet */
    if (pc == -1) {
      pc = entry.addr;
    } else if (pc < entry.addr) {
      /* Gap between current PC and the instruction address */
      for (var i = 0; i < entry.addr - pc; i++) {
        bytes.push(0x00);
      }
      pc = entry.addr;
    }
    /* Concat the two arrays */
    bytes.push(...entry.lens);
    pc += entry.lens.length;
  });
  return bytes;
}

/**
 * Recursively parse assembly source strings for `.include` directives in the browser.
 *
 * @param {string} rootUrl   - Base URL for resolving relative includes (where the root file is located).
 * @param {string} rootName  - A key name for the root file (e.g. "main.asm").
 * @param {string} rootSource - The contents of the root file (already provided).
 * @param {object} results   - Object to store file contents by filename.
 * @param {Set<string>} visited - Tracks visited URLs to prevent infinite loops.
 * @returns {Promise<object>} results - { "filename.asm": "contents", ... }
 */
async function parseIncludesFromString(rootUrl, rootName, rootSource, results = {}, visited = new Set()) {
  // Prevent reprocessing same "file"
  if (visited.has(rootName)) {
    return results;
  }
  visited.add(rootName);

  // Store the provided source
  results[rootName] = rootSource;

  // Regex for `.include "something"`
  const includeRegex = /^\s*\.(include|incbin)\s+"([^"]+)"\s*$/gm;

  let match;
  while ((match = includeRegex.exec(rootSource)) !== null) {
    const directive = match[1];
    const includePath = match[2];

    const localPath = `user/${includePath}`;
    const localContents = await explorer.readFile(localPath);
    if (localContents.text) {
      if (!visited.has(localPath)) {
        await parseIncludesFromString(rootUrl, localPath, localContents.text, results, visited);
      }
      continue;
    }

    const includeUrl1 = new URL(`files/headers/${includePath}`, `${rootUrl}`);
    const includeUrl2 = new URL(`files/${includePath}`, `${rootUrl}`);

    if (!visited.has(includeUrl1) && !visited.has(includeUrl2)) {
      // Fetch included file
      let includeUrl = includeUrl1;
      const response = await fetch(includeUrl.href)
        .then(async (response) => {
          if (!response.ok) {
            includeUrl = includeUrl2;
            return await fetch(includeUrl.href);
          }
          return response;
        })
        .catch((e) => {
          console.error('Exception', e);
          return { ok: false };
        });
      if (!response.ok) {
        // throw new Error(`Failed to load ${includeUrl}: ${response.statusText}`);
        console.error(`Failed to load ${includeUrl}: ${response.statusText}`);
        continue;
      }

      if (directive == 'include') {
        const includeSource = await response.text();

        // Recurse using the fetched contents
        await parseIncludesFromString(
          rootUrl, // new URL('./', includeUrl).href, // new base for further includes
          includeUrl.pathname.slice(1), // use URL as the key
          includeSource,
          results,
          visited,
        );
      } else {
        const buffer = await response.arrayBuffer();
        results[includeUrl.pathname.slice(1)] = new Uint8Array(buffer);
      }
    }
  }

  return results;
}

// Read the line records from the final ELF32-Z80 image, after section relocation.
function linkedSourceLines(elf, fileName) {
  const data = new DataView(elf.buffer, elf.byteOffset, elf.byteLength);
  const sectionTable = data.getUint32(32, true);
  const entrySize = data.getUint16(46, true);
  const sectionCount = data.getUint16(48, true);
  function section(index) {
    const header = sectionTable + index * entrySize;
    const start = data.getUint32(header + 16, true);
    return elf.subarray(start, start + data.getUint32(header + 20, true));
  }
  const decoder = new TextDecoder();
  function stringAt(table, offset) {
    return decoder.decode(table.subarray(offset, table.indexOf(0, offset)));
  }

  const sectionNames = section(data.getUint16(50, true));
  let records, names;
  for (let i = 0; i < sectionCount; i++) {
    const name = stringAt(sectionNames, data.getUint32(sectionTable + i * entrySize, true));
    if (name === '.stab') records = section(i);
    if (name === '.stabstr') names = section(i);
  }
  const lines = new Map();
  if (!records || !names) return lines;
  const stabs = new DataView(records.buffer, records.byteOffset, records.byteLength);
  let inEditorFile = false;
  for (let i = 0; i + 12 <= records.length; i += 12) {
    const type = stabs.getUint8(i + 4);
    if (type === 0x64 || type === 0x84) { // N_SO / N_SOL: source file or include
      inEditorFile = stringAt(names, stabs.getUint32(i, true)) === '/src/' + fileName;
    } else if (type === 0x44 && inEditorFile) { // N_SLINE: line number and linked instruction address
      const line = stabs.getUint16(i + 6, true);
      if (line) lines.set(stabs.getUint32(i + 8, true), line - 1);
    }
  }
  return lines;
}

async function assemble() {
  const code = editor.getValue();
  const generation = editor.editor.changeGeneration();
  const fileName = editor.fileName ?? 'main.asm';
  const withOS = emulator.uses === 'zealos';
  editor.clearErrors();

  const verbose = document.querySelector('input[name=verbose]');

  const includes = await parseIncludesFromString(
    location.href + '/files/headers', // base path for includes
    'source', // key for the root file
    code, // the initial contents
  ).then((files) => {
    delete files.source;
    return files;
  });
  console.log(includes);

  const hexView = document.getElementById('hex-view');
  hexView.textContent = '';
  const listView = document.getElementById('list-view');

  const org = withOS ? '0x4000' : '0x0000';
  const toolchain = new GnuToolchain({
    verbose: verbose.checked,
  });
  const { bin, listing, map, elf, errors } = await toolchain.execute(fileName, code, { includes, org }).catch((errors) => {
    if (Array.isArray(errors)) {
      errors.forEach((err) => console.error(err.source, err.message));
    } else {
      console.error(errors);
    }

    return { bin: null, listing: null, map: null, errors };
  });

  if (!bin) {
    console.error('no binary file was produced, check for errors');
    document.getElementById('build-output').open = true;
    document.getElementById('log').className = 'log error';
    document.getElementById('log').textContent = 'No binary file was produced, check for errors';
    if (Array.isArray(errors)) {
      errors?.forEach((err) => {
        hexView.textContent += `${err.source}: ${err.message}\n`;
        if (err.lineNum) {
          hexView.textContent += `Line: ${err.filename}:${err.lineNum}\n`;
          editor.gotoLine(err.lineNum - 1, { error: true });
        }
      });
    } else {
      hexView.textContent += errors.message ?? JSON.stringify(errors);
    }
    return;
  }

  document.getElementById('log').className = 'log';
  document.getElementById('log').textContent = 'Assembly successful';

  const hex = bin.reduce((acc, byte, i) => {
    if (i % 16 === 0) {
      acc += i.toString(16).padStart(4, '0') + ': ';
    }
    acc += byte.toString(16).padStart(2, '0') + ' ';
    if ((i + 1) % 16 === 0) {
      acc += '\n';
    }

    return acc;
  }, '');

  hexView.textContent = hex;
  listView.textContent = listing + `\n\n\nGLD MAP /user/${fileName}\n` + map;

  return { bin, sourceLines: linkedSourceLines(elf, fileName), generation, fileName, withOS };
}
