// ESLint flat config for the Magic dashboard.
//
// Policy: zero warnings (`npm run lint` runs with --max-warnings 0). When a rule does not
// fit this codebase, turn it off here with the reason, rather than scattering inline disables.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public/ngsw-worker.js', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      // The rules SonarCloud (and SonarQube for IDE) apply, so the CLI and hooks catch them too.
      sonarjs.configs.recommended,
    ],
    plugins: { 'simple-import-sort': simpleImportSort, unicorn },
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Imports and exports are sorted (auto-fixable with `npm run lint:fix`).
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Rules Sonar's "Sonar way" profile runs through other plugins, which sonarjs does not bundle
      // (the S numbers are the ones SonarQube for IDE reports them under).
      'react/jsx-child-element-spacing': 'error', // S6772
      'react/no-array-index-key': 'error', // S6479
      'jsx-a11y/no-aria-hidden-on-focusable': 'error', // S6825
      'unicorn/prefer-at': 'error', // S7755
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-global-this': 'error',
      'unicorn/no-negated-condition': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-zero-fractions': 'error',
      'unicorn/prefer-single-call': 'error',
      'unicorn/prefer-code-point': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/prefer-export-from': 'error',
      'unicorn/no-useless-fallback-in-spread': 'error',
      'unicorn/new-for-builtins': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-math-min-max': 'error',
      'unicorn/prefer-math-trunc': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-dom-node-remove': 'error',
      'unicorn/prefer-dom-node-append': 'error',
      'unicorn/prefer-dom-node-dataset': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/no-instanceof-builtins': 'error',
      'unicorn/prefer-structured-clone': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/no-array-push-push': 'off', // superseded by prefer-single-call

      // Unused variables are errors, but a leading underscore marks a deliberate ignore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Dialogs move focus to their first field on open, as the WAI-ARIA dialog pattern asks for.
      'jsx-a11y/no-autofocus': 'off',
      // Select (components/Select.tsx) renders a button, which a wrapping <label> does label;
      // the rule just cannot see inside custom components without being told.
      'jsx-a11y/label-has-associated-control': [
        'error',
        { controlComponents: ['Select'], depth: 3 },
      ],
      // Fire-and-forget promises in event handlers are idiomatic in React (onClick={save}).
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    // Tests: vitest globals, and fixtures are allowed to be loosely typed.
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Tests build fixtures and stubs that Sonar's production rules don't apply to.
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
    },
  },
  {
    // Config files run in Node and are not part of the tsconfig project.
    files: ['*.config.{js,ts}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
  {
    // eslint-config-prettier turns this off as a formatting rule, but Sonar reports it (S6772):
    // JSX text running into an element on the next line is ambiguous, so the space is explicit.
    files: ['**/*.tsx'],
    rules: { 'react/jsx-child-element-spacing': 'error' },
  },
);
