import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  clean: true,
  dts: true,
  entry: ['lib/buffer.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Buffer',
  keepNames: true,
  minify: !options.watch,
  sourcemap: true,
  splitting: false,
}))
