import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.tsx'],
  dts: true,
  format: ['esm', 'cjs'],
  clean: true,
  external: ['react', 'react-native', 'clsx', 'tailwind-merge'],
  esbuildOptions(options) {
    options.keepNames = true
    options.jsx = 'automatic'
  },
  treeshake: true,
  minify: true,
  outDir: '../dist',
  sourcemap: true,
  ignoreWatch: ['**/{.git,node_modules}/**'],
  metafile: true,
  target: 'es2020',
  splitting: true,
})
