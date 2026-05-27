import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    'dist',
    '.next',
    'next-env.d.ts',
    'test-results',
    'playwright-report',
    'coverage',
    // Local scratch/duplicate copies of the project that occasionally land in
    // the workspace (e.g. zipped exports) — never lint them as part of CI.
    // The `**` segments are required for ESLint flat config to match nested files.
    '**/farmer-portal */**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
])
