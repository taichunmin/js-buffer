import { defineConfig } from 'tsup'
import pkg from './package.json'

export default defineConfig((options) => ({
  clean: !options.watch, // only clean once when not watching
  entry: ['lib/buffer.ts'],
  env: { VERSION: pkg.version },
  experimentalDts: true,
  format: ['cjs', 'esm', 'iife'],
  globalName: 'taichunmin.buffer',
  keepNames: true,
  minify: !options.watch,
  publicDir: 'static',
  sourcemap: true,
  splitting: false,
}))
