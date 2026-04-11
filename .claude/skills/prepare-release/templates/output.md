## リリース準備完了

**Version**: OLD_VERSION → NEW_VERSION
**Date**: YYYY-MM-DD

### CHANGELOG 更新内容

| Category | Entries | Source                       |
|:---------|:--------|:-----------------------------|
| Added    | N       | existing / generated / mixed |
| Changed  | N       | ...                          |
| Fixed    | N       | ...                          |

### 更新ファイル

- [ ] `CHANGELOG.md`
- [ ] `package.json`
- [ ] `src-tauri/Cargo.toml`
- [ ] `src-tauri/tauri.conf.json`

### Next Steps

1. 変更内容をレビューする
2. コミットする:
   ```bash
   git add CHANGELOG.md package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
   git commit -m "[docs] v{VERSION} リリース準備"
   ```
3. タグを作成してプッシュする:
   ```bash
   git tag v{VERSION}
   git push origin main --tags
   ```
4. GitHub Releases でドラフトを確認して公開する
