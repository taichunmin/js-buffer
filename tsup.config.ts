import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  entry: ['lib/buffer.ts'],
  dts: true,
  format: ['cjs', 'esm', 'iife'],
  minify: true,
  sourcemap: true,
  splitting: false,
})
