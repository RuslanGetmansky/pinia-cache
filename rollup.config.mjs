import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const bundle = (config) => ({
  ...config,
  input: 'src/pinia-cache.ts',
  external: (id) => !/^[./]/.test(id),
})

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `dist/pinia-cache.mjs`,
        format: 'es',
        sourcemap: true,
        globals: {
          'vue-demi': 'VueDemi',
        },
      },
      {
        file: `dist/pinia-cache.cjs`,
        format: 'cjs',
        sourcemap: true,
        globals: {
          'vue-demi': 'VueDemi',
        },
      },
      {
        name: 'PiniaCachePlugin',
        file: `dist/pinia-cache.umd.js`,
        format: 'umd',
        sourcemap: true,
        globals: {
          'vue-demi': 'VueDemi',
        },
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/pinia-cache.d.ts`,
      format: 'es',
    },
  }),
]
