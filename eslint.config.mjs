import love from 'eslint-config-love'
import stylistic from '@stylistic/eslint-plugin'
import tsdoc from 'eslint-plugin-tsdoc'

export default [
  {
    ignores: ['dist/**', 'lib/coverage/**', '**/node_modules/**'],
  },
  {
    ...love,
    files: ['**/*.ts'],
  },
  {
    ...stylistic.configs.customize({
      braceStyle: '1tbs',
      commaDangle: 'always-multiline',
      indent: 2,
      arrowParens: false,
      jsx: false,
      quoteProps: 'as-needed',
      quotes: 'single',
      semi: false,
    }),
    files: ['**/*.ts'],
  },
  {
    files: ['**/*.ts'],
    plugins: { tsdoc },
    rules: {
      // rules newly added by eslint-config-love which conflict with the existing code style
      '@eslint-community/eslint-comments/require-description': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      complexity: 'off',
      'max-lines': 'off',
      'no-negated-condition': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'prefer-named-capture-group': 'off',
      'require-unicode-regexp': 'off',

      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'tsdoc/syntax': 'warn',
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        enums: 'always-multiline',
        exports: 'always-multiline',
        generics: 'always-multiline',
        imports: 'always-multiline',
        objects: 'always-multiline',
        tuples: 'always-multiline',
        functions: 'only-multiline',
      }],
      '@stylistic/generator-star-spacing': ['error', 'both'],
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|>': 'before' } }],
      '@stylistic/type-generic-spacing': 'off',
      '@stylistic/yield-star-spacing': ['error', 'both'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.bench.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]
