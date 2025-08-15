import * as esbuild from 'esbuild';

const omitCPUs = {
  name: 'omit-cpus',
  setup(build) {
    const cpuRegex = /cpu\/(i8080|m6800|c6502|i8008|cdp1802|m6809)\.js$/;
    build.onResolve({ filter: cpuRegex }, (args) => {
      return { path: args.path, namespace: 'stub' };
    });

    build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
      let name = args.path.match(/([^/]+)\.js$/)[1];
      name = name.replace(/[^a-zA-Z0-9_$]/g, '_');
      const varName = name.toUpperCase();
      return {
        contents: `export const ${varName} = {};`,
        loader: 'js',
      };
    });
  },
};

await esbuild.build({
  entryPoints: ['asm80-playground.js'],
  bundle: true,
  outfile: '../../js/asm80-playground.js',
  format: 'iife',
  globalName: 'ASM',
  plugins: [omitCPUs],
});
