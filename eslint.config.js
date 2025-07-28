const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'log', 'info'] }],
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.*', '**/src/lib/**'],
    rules: {
      'no-console': 'off', // Allow all console methods in tests and lib files
    },
  },
]