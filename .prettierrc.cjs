module.exports = {
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '^react$',
    '<TYPES>^(node:)', // Node.js型インポート
    '<TYPES>', // その他の型インポート
    '<TYPES>^[.]', // 相対型インポート
    '<BUILTIN_MODULES>', // 組み込みモジュール (node:fs など)
    '<THIRD_PARTY_MODULES>', // npm パッケージ (自動検出)
    '^@/(.*)$', // 内部エイリアス (例: @/components)
    '^[./]', // 相対パス
  ],
  importOrderCaseSensitive: true,
}
