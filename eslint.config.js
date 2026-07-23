import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', '.runtime', 'docs/design/prototypes', 'scripts/run_design_browser_qa.cjs'] },
  eslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error'
    },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.mjs', 'tools/**/*.mjs'],
    languageOptions: { globals: {
      process: 'readonly',
      console: 'readonly',
      Buffer: 'readonly',
      URL: 'readonly',
      structuredClone: 'readonly',
      fetch: 'readonly',
      setTimeout: 'readonly',
    } },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { self: 'readonly', caches: 'readonly', URL: 'readonly', fetch: 'readonly' } },
  },
);
