// ESLint flat config: JavaScript + React + hooks + accessibility rules.
// Layout is Prettier's job (eslint-config-prettier turns off the conflicting style rules).
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'cypress/screenshots/**', 'cypress/videos/**'] },

  js.configs.recommended,

  // App code
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, __API_BASE_URL__: 'readonly' },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/prop-types': 'off', // no PropTypes in this project
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // Jest tests
  {
    files: ['src/**/__tests__/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    plugins: { jest },
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    rules: { ...jest.configs.recommended.rules },
  },

  // Cypress specs and support files
  {
    files: ['cypress/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.mocha, cy: 'readonly', Cypress: 'readonly', expect: 'readonly' },
    },
  },

  // Node-side config files
  {
    files: ['*.config.{js,cjs}', 'babel.config.cjs', 'jest.config.cjs'],
    languageOptions: { globals: { ...globals.node } },
  },

  prettier,
]
