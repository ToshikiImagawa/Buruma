// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['node_modules/', 'out/', 'dist/', '.vite/'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: [
      'src/main.ts',
      'src/preload.ts',
      'vite.*.config.ts',
      'forge.config.ts',
      'postcss.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['src/renderer.tsx', 'src/App.tsx', 'src/components/**/*.tsx', 'src/lib/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      'import-x/no-unresolved': 'error',
      'import-x/named': 'error',
      'import-x/no-duplicates': 'warn',
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
        node: true,
      },
      'import-x/core-modules': ['electron'],
    },
  },

  eslintConfigPrettier,
)
