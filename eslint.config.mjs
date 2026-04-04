// @ts-check
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['node_modules/', 'out/', 'dist/', '.vite/', '.prettierrc.cjs'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: [
      'src/processes/main/**/*.ts',
      'src/processes/preload/**/*.ts',
      'vite.*.config.ts',
      'forge.config.ts',
      'postcss.config.js',
      'scripts/**/*.mjs',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['src/processes/renderer/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
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
