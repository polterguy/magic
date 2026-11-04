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
    ],
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
    },
  },
  {
    // Config files run in Node and are not part of the tsconfig project.
    files: ['*.config.{js,ts}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
