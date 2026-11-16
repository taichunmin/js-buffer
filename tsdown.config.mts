import { defineConfig, type UserConfig } from 'tsdown'

export default defineConfig(options => {
  const base: UserConfig = {
    clean: !options.watch, // only clean once when not watching
    entry: ['lib/buffer.ts'],
    minify: options.watch ? false : {
      compress: { keepNames: { class: true, function: true } },
      mangle: { keepNames: true },
    },
    platform: 'neutral',
    sourcemap: true,
  }
  return [
    {
      ...base,
      copy: { from: 'static/**/*', flatten: false },
      dts: true,
      format: ['cjs', 'esm'],
      outExtensions: ({ format }) => format === 'cjs' ? { js: '.js', dts: '.d.ts' } : { js: '.mjs', dts: '.d.mts' },
      outputOptions: (outputOptions, format, { cjsDts }) => {
        // keep `Buffer.name` from being renamed to `Buffer$1` in cjs, but not in dts builds, or the dts will import a missing runtime helper
        if (format === 'cjs' && !cjsDts) outputOptions.keepNames = true
        return outputOptions
      },
    },
    {
      ...base,
      deps: { alwaysBundle: [/^lodash-es/] }, // bundle all dependencies for browsers
      format: 'iife',
      platform: 'browser',
      globalName: 'taichunmin.buffer',
      outputOptions: { entryFileNames: '[name].global.js' },
    },
  ]
})
