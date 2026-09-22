import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Playwright-specific rules (missing awaits, focused tests, conditionals in tests)
    // only apply to the specs themselves.
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.spec.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Skipping on a missing API key is deliberate; the rule still catches a
      // `test.skip()` left behind by accident.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
  {
    // The ESLint config is not part of the TypeScript project.
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
