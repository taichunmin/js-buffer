module.exports = {
  env: {
    es2022: true,
    jest: true,
  },
  plugins: ['eslint-plugin-tsdoc'],
  extends: ['love'],
  rules: {
    '@typescript-eslint/no-unsafe-argument': 0, // 0 = off, 1 = warn, 2 = error
    '@typescript-eslint/non-nullable-type-assertion-style': 0, // 0 = off, 1 = warn, 2 = error
    '@typescript-eslint/return-await': 0, // 0 = off, 1 = warn, 2 = error
    '@typescript-eslint/strict-boolean-expressions': 0, // 0 = off, 1 = warn, 2 = error
    '@typescript-eslint/unbound-method': 0, // 0 = off, 1 = warn, 2 = error
    'multiline-ternary': 0, // 0 = off, 1 = warn, 2 = error
    'no-return-await': 0, // 0 = off, 1 = warn, 2 = error
    'tsdoc/syntax': ['warn', {
      ignoreUndefinedTags: true,
    }], // 0 = off, 1 = warn, 2 = error
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
    }],
    '@typescript-eslint/comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
    }],
  },
}