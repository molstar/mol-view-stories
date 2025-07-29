import dts from 'rollup-plugin-dts';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  input: './node_modules/molstar/lib/extensions/mvs/mvs-data.d.ts',
  output: {
    file: './tmp/mvs.d.ts',
    format: 'es',
  },
  plugins: [dts({ 
    respectExternal: true,
    compilerOptions: {
      preserveSymlinks: false,
    }
  })],
};
