# 品質チェックリスト: AI コンフリクト解決（FR_506）

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | AI コンフリクト解決（FR_506） |
| チケット番号 | FR_506 |
| 対象仕様書 | [claude-code-integration_spec.md](../../specification/claude-code-integration_spec.md) |
| 対象設計書 | [claude-code-integration_design.md](../../specification/claude-code-integration_design.md) |
| PRD | [claude-code-integration.md](../../requirement/claude-code-integration.md) |
| タスク分解 | [tasks.md](./tasks.md) |
| 生成日 | 2026-04-14 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 7 | 5 | 2 | 0 |
| 仕様レビュー | 8 | 5 | 3 | 0 |
| 設計レビュー | 7 | 4 | 3 | 0 |
| 実装レビュー | 10 | 5 | 4 | 1 |
| テストレビュー | 8 | 5 | 3 | 0 |
| ドキュメントレビュー | 3 | 0 | 2 | 1 |
| セキュリティレビュー | 5 | 4 | 1 | 0 |
| パフォーマンスレビュー | 4 | 1 | 2 | 1 |
| デプロイレビュー | 3 | 2 | 1 | 0 |
| **合計** | **55** | **31** | **21** | **3** |

**優先度レベル**:

- **P1**: 高 — マージ前に必須
- **P2**: 中 — リリース前に完了すべき
- **P3**: 低 — あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] FR-024: コンフリクト内容のワンショット送信

- [ ] `ConflictResolveRequest` で `worktreePath`、`filePath`、`threeWayContent`（base/ours/theirs）を受け取る
- [ ] `claude -p` でワンショット実行し、merged 結果を取得する
- [ ] 結果は `claude-conflict-resolved` イベントで非同期通知される

**検証方法**:
- `claude_resolve_conflict` IPC コマンドが正しく動作することを確認
- Rust 側で `tokio::process::Command` によるワンショット実行を検証

**関連要求**: FR_506_01, FR-024

---

### CHK-102 [P1] FR-025: AI 解決案のプレビュー表示

- [ ] AI が生成した `mergedContent` が `ThreeWayMergeView` の merged ペインに表示される
- [ ] プレビュー状態であることが視覚的に識別できる（承認前）
- [ ] プレビュー中もエディタの内容が確認できる

**検証方法**:
- コンフリクトファイル選択 → AI 解決ボタン → merged ペインにプレビュー表示される流れを確認
- UI のスクリーンショットで視覚的な識別を検証

**関連要求**: FR_506_02, FR-025

---

### CHK-103 [P1] FR-026: 解決案の承認・拒否

- [ ] 承認ボタンで AI 結果を適用し、コンフリクトを解決済みマークする
- [ ] 拒否ボタンで元の状態（AI 適用前）に戻す
- [ ] 承認/拒否後に UI 状態が正しく更新される

**検証方法**:
- 承認 → `conflictResolve` + `conflictMarkResolved` が呼ばれることを検証
- 拒否 → merged ペインが元の状態に戻ることを検証

**関連要求**: FR_506_03, FR-026

---

### CHK-104 [P1] FR-027: 全ファイル一括 AI 解決

- [ ] コンフリクトファイル一覧ヘッダーに「AI で全て解決」ボタンが表示される
- [ ] 全ファイルが並列（最大 3 並列）で AI に送信される
- [ ] プログレスバーで進捗（completed / total）が表示される
- [ ] 一部ファイルの解決が失敗しても、他ファイルの処理は継続する
- [ ] 失敗ファイルはエラー状態として個別に表示される

**検証方法**:
- 3 ファイル以上のコンフリクトで一括解決を実行し、並列数とプログレスを確認
- 1 ファイルを意図的に失敗させ、他ファイルが正常に処理されることを確認

**関連要求**: FR_506_04, FR-027

---

### CHK-105 [P1] FR-028: 個別ファイル AI 解決ボタン

- [ ] 各コンフリクトファイル行に「AI 解決」ボタンが表示される
- [ ] ボタン押下で当該ファイルのみが AI に送信される
- [ ] 解決中はボタンがローディング状態になる

**検証方法**:
- 個別ファイルの AI 解決ボタンが動作することを確認
- ローディング状態の表示を確認

**関連要求**: FR_506_04, FR-028

---

### CHK-106 [P2] FR-029: AI 解決後の手動微調整

- [ ] AI 解決案の承認後も ThreeWayMergeView のエディタで手動編集が可能
- [ ] 手動編集した内容で解決結果を更新できる

**検証方法**:
- AI 解決 → 承認 → エディタで内容変更 → 再度 Apply Resolution が動作することを確認

**関連要求**: FR_506_05, FR-029

---

### CHK-107 [P2] NFR-004: サブプロセス実行範囲制限

- [ ] `claude -p` のワンショット実行で `cwd` がワークツリーパスに設定されている
- [ ] 環境変数は `PATH`、`HOME`、`CLAUDE_*` のみ継承されている

**検証方法**:
- Rust 側の `tokio::process::Command` 設定を確認
- 既存のワンショット実行（`generate_commit_message` 等）と同一パターンであることを確認

**関連要求**: NFR_501, NFR-004

---

## 2. 仕様レビュー

### CHK-201 [P1] IPC API の実装

- [ ] `claude_resolve_conflict` コマンドが `IPCChannelMap` に定義されている
- [ ] `claude-conflict-resolved` イベントが `IPCEventMap` に定義されている
- [ ] Rust 側の `#[tauri::command]` ハンドラーが `lib.rs` に登録されている
- [ ] 引数型 `ConflictResolveRequest` が spec の定義と一致する

**検証方法**:
```bash
# TypeScript 側の IPC 定義を確認
grep "claude_resolve_conflict" src/lib/ipc.ts
grep "claude-conflict-resolved" src/lib/ipc.ts

# Rust 側のコマンド登録を確認
grep "claude_resolve_conflict" src-tauri/src/lib.rs
```

**参照**: spec § 4.1.7, § 4.1.8

---

### CHK-202 [P1] ConflictResolveRequest 型定義

- [ ] TypeScript: `{ worktreePath: string; filePath: string; threeWayContent: ThreeWayContent }` と一致
- [ ] Rust: `ConflictResolveRequest` が `Deserialize` derive を持つ
- [ ] `ThreeWayContent` は `src/domain/index.ts` の既存型を再利用している

**検証方法**:
```bash
# TypeScript 型定義を確認
grep -A5 "ConflictResolveRequest" src/domain/index.ts

# Rust 型定義を確認
grep -A5 "ConflictResolveRequest" src-tauri/src/features/claude_code_integration/domain.rs
```

**参照**: spec § 4.3

---

### CHK-203 [P1] ConflictResolveResult 型定義（discriminated union）

- [ ] TypeScript: `status: 'resolved'` の場合 `mergedContent: string` が必須
- [ ] TypeScript: `status: 'failed'` の場合 `error: string` が必須
- [ ] 両方に `worktreePath` と `filePath` が含まれる
- [ ] Rust: `Serialize` derive を持ち、TypeScript 側と JSON シリアライズが一致する

**検証方法**:
```bash
grep -A10 "ConflictResolveResult" src/domain/index.ts
grep -A10 "ConflictResolveResult" src-tauri/src/features/claude_code_integration/domain.rs
```

**参照**: spec § 4.3

---

### CHK-204 [P1] ClaudeRepository インターフェース拡張

- [ ] TypeScript: `ClaudeRepository` に `resolveConflict(request: ConflictResolveRequest): Promise<void>` が追加されている
- [ ] TypeScript: `ClaudeRepository` に `onConflictResolved(callback): () => void` が追加されている
- [ ] Rust: `ClaudeRepository` trait に `resolve_conflict` メソッドが追加されている

**検証方法**:
```bash
grep "resolveConflict\|resolve_conflict" src/features/claude-code-integration/application/repositories/claude-repository.ts
grep "resolve_conflict" src-tauri/src/features/claude_code_integration/application/repositories.rs
```

**参照**: design § 6.1, § 4.2

---

### CHK-205 [P1] ClaudeService 状態管理拡張

- [ ] `isResolvingConflict$: Observable<boolean>` が追加されている
- [ ] `conflictResult$: Observable<ConflictResolveResult | null>` が追加されている
- [ ] `resolvingProgress$: Observable<{ total: number; completed: number; failed: number } | null>` が追加されている
- [ ] 各 Observable に対応する setter メソッドが存在する

**検証方法**:
```bash
grep "isResolvingConflict\|conflictResult\|resolvingProgress" src/features/claude-code-integration/application/services/claude-service-interface.ts
```

---

### CHK-206 [P2] イベント通知フロー

- [ ] `claude_resolve_conflict` コマンドは即座に `void` を返す（非同期パターン）
- [ ] 結果は `claude-conflict-resolved` イベントで後から通知される
- [ ] イベントペイロードが `ConflictResolveResult` 型と一致する

**検証方法**:
- Rust 側の `app_handle.emit("claude-conflict-resolved", ...)` 呼び出しを確認
- TypeScript 側の `listenEvent` 購読を確認

**参照**: spec § 4.1.7, § 4.1.8

---

### CHK-207 [P2] プロンプトビルダーの構造

- [ ] base / ours / theirs がセクション区切りで構造化されている
- [ ] ファイルパス情報が含まれている
- [ ] merged 結果のみを返すよう指示されている
- [ ] 余分な説明やコメントを含めないよう指示されている

**検証方法**:
- `conflict_resolve_prompt.rs` のユニットテストでプロンプト内容を検証

**参照**: design § 9.1（プロンプトビルダーの設計判断）

---

### CHK-208 [P2] ConflictResolver Props 拡張

- [ ] `ConflictResolver` に `onAIResolve?: (filePath: string) => void` Props が追加されている
- [ ] `ConflictResolver` に `onAIResolveAll?: () => void` Props が追加されている
- [ ] 進捗表示用の Props（`aiProgress`、`isAIResolving` 等）が追加されている
- [ ] Props はオプショナルであり、渡されない場合は AI ボタンが表示されない

**検証方法**:
- `conflict-resolver.tsx` の Props 型定義を確認
- Props 未指定時に AI ボタンが非表示であることを確認

---

## 3. 設計レビュー

### CHK-301 [P1] Clean Architecture 4 層構成の準拠

- [ ] Rust: UseCase は `application/usecases.rs` に配置
- [ ] Rust: プロンプトビルダーは `infrastructure/` に配置
- [ ] Rust: コマンドハンドラーは `presentation/commands.rs` に配置
- [ ] TypeScript: UseCase は `application/usecases/` に配置
- [ ] TypeScript: ViewModel は `presentation/` に配置
- [ ] 依存方向: `domain ← application ← infrastructure / presentation` の一方向のみ

**検証方法**:
```bash
# ファイル配置を確認
ls src-tauri/src/features/claude_code_integration/infrastructure/conflict_resolve_prompt.rs
ls src-tauri/src/features/claude_code_integration/application/usecases.rs
ls src/features/claude-code-integration/application/usecases/resolve-conflict-usecase.ts
ls src/features/claude-code-integration/presentation/claude-conflict-viewmodel.ts
```

---

### CHK-302 [P1] A-004: feature 間直接参照禁止

- [ ] `advanced-git-operations` が `claude-code-integration` を直接 import していない
- [ ] `claude-code-integration` が `advanced-git-operations` を直接 import していない
- [ ] AI ボタンのコールバックは Props 経由で外部から注入されている
- [ ] 統合は `repository-viewer` または UI Integration レイヤーで行われている

**検証方法**:
```bash
# advanced-git-operations → claude-code-integration の直接参照がないことを確認
grep -r "claude-code-integration" src/features/advanced-git-operations/ || echo "OK: no direct reference"

# claude-code-integration → advanced-git-operations の直接参照がないことを確認
grep -r "advanced-git-operations" src/features/claude-code-integration/ || echo "OK: no direct reference"
```

---

### CHK-303 [P1] B-002: AI 結果のプレビュー → 承認フロー

- [ ] AI が生成した merged コンテンツは直接適用されず、プレビュー表示される
- [ ] ユーザーが明示的に承認してから適用される
- [ ] 拒否で元の状態に戻せる

**検証方法**:
- UI フローでプレビュー → 承認/拒否の 2 ステップが実装されていることを確認

---

### CHK-304 [P1] ワンショット実行パターンの踏襲

- [ ] `review_diff` / `explain_diff` と同じ実行パターン（`claude -p`、イベント通知）を使用
- [ ] セッション管理（ライブセッション）に依存していない
- [ ] 各ファイルを独立して処理可能

**検証方法**:
- Rust 側の `resolve_conflict` UseCase が既存のワンショットパターンと同一構造であることを確認

---

### CHK-305 [P2] DI 設定の正確性

- [ ] `di-tokens.ts` に `ResolveConflictRendererUseCaseToken` と `ClaudeConflictViewModelToken` が追加されている
- [ ] `di-config.ts` に UseCase（Singleton）と ViewModel（Transient）が登録されている
- [ ] `setUp` に `onConflictResolved` イベントリスナーが登録されている
- [ ] `tearDown` でリスナーのクリーンアップが行われている

**検証方法**:
```bash
grep "ResolveConflictRendererUseCaseToken\|ClaudeConflictViewModelToken" src/features/claude-code-integration/di-tokens.ts
grep "onConflictResolved" src/features/claude-code-integration/di-config.ts
```

---

### CHK-306 [P2] 3 並列制御の設計

- [ ] 一括解決時の同時実行数が 3 に制限されている
- [ ] セマフォまたは Promise チャンク方式で実装されている
- [ ] 並列実行中の進捗が正確にトラッキングされている

**検証方法**:
- `ClaudeConflictViewModel.resolveAll` のテストで 5 ファイル以上のケースを実行し、同時実行数が 3 を超えないことを検証

---

### CHK-307 [P2] ThreeWayContent 型の再利用

- [ ] `src/domain/index.ts` の既存 `ThreeWayContent` 型を使用している
- [ ] 新規の型定義を重複して作成していない
- [ ] `advanced-git-operations` の `git_conflict_file_content` IPC で取得した `ThreeWayContent` をそのまま使用できる

**検証方法**:
```bash
grep "ThreeWayContent" src/domain/index.ts
grep "import.*ThreeWayContent" src/features/claude-code-integration/
```

---

## 4. 実装レビュー

### CHK-401 [P1] Rust コード構造

- [ ] `conflict_resolve_prompt.rs` が `infrastructure/` 配下に存在する
- [ ] `resolve_conflict` 関数が `application/usecases.rs` に追加されている
- [ ] `claude_resolve_conflict` コマンドが `presentation/commands.rs` に追加されている
- [ ] `mod.rs` / `mod` 宣言が正しく更新されている

**検証方法**:
```bash
cargo build 2>&1 | head -20
```

---

### CHK-402 [P1] TypeScript コード構造

- [ ] `resolve-conflict-usecase.ts` が `application/usecases/` に存在する
- [ ] `claude-conflict-viewmodel.ts` が `presentation/` に存在する
- [ ] `use-claude-conflict-viewmodel.ts` が `presentation/` に存在する
- [ ] UseCase が `ConsumerUseCase<ConflictResolveRequest>` を implements している

**検証方法**:
```bash
npm run typecheck 2>&1 | head -20
```

---

### CHK-403 [P1] エラーハンドリング

- [ ] Rust: `resolve_conflict` UseCase が `AppResult<T>` を返す
- [ ] Rust: CLI 実行失敗時に `ConflictResolveResult { status: 'failed', error }` を返す
- [ ] TypeScript: Repository の呼び出し失敗時に Service の状態をリセットする
- [ ] TypeScript: 一括解決で一部失敗時に `Promise.allSettled` パターンを使用する

**検証方法**:
- エラーケースのユニットテストで検証

---

### CHK-404 [P1] UseCase パターンの準拠

- [ ] UseCase は 1 クラス = 1 操作の原則に従っている
- [ ] `ConsumerUseCase<T>` インターフェースを implements している
- [ ] ステートレスである（内部に BehaviorSubject 等の状態を持たない）
- [ ] Repository + Service を constructor で受け取り、DI で注入される

**検証方法**:
- `resolve-conflict-usecase.ts` のクラス定義を確認
- 既存の `ReviewDiffUseCase` と構造を比較

---

### CHK-405 [P1] ViewModel + Hook パターンの準拠

- [ ] ViewModel は純粋な TypeScript クラスとして実装されている
- [ ] Observable プロパティは constructor でフィールドとして 1 回だけ生成されている
- [ ] Hook ラッパーで `useResolve` + `useObservable` パターンを使用している
- [ ] ViewModel は Transient で DI 登録されている

**検証方法**:
- `claude-conflict-viewmodel.ts` のクラス定義を確認
- 既存の `ClaudeReviewViewModel` と構造を比較

---

### CHK-406 [P2] import 規約の準拠

- [ ] `import type` を優先し、value import と type import を分けている
- [ ] パスエイリアス（`@/`、`@domain`、`@lib`）を使用している
- [ ] feature 間の直接 import がない

**検証方法**:
```bash
npm run lint 2>&1 | head -20
```

---

### CHK-407 [P2] ConflictResolver UI 変更

- [ ] AI ボタンは Props が渡されない場合に非表示（既存動作に影響なし）
- [ ] ボタンのスタイルが既存の UI と統一されている（Shadcn/ui コンポーネント使用）
- [ ] ローディング状態・エラー状態の表示が適切

**検証方法**:
- Props なしで ConflictResolver をレンダリングし、既存動作に変化がないことを確認

---

### CHK-408 [P2] プログレスバー実装

- [ ] `{ total, completed, failed }` の進捗情報が正確に表示される
- [ ] 完了時にプログレスバーが 100% になる
- [ ] 失敗ファイルの数が視覚的に識別できる

**検証方法**:
- 5 ファイルコンフリクトで一括解決を実行し、プログレスの正確性を確認

---

### CHK-409 [P2] Rust lib.rs へのコマンド登録

- [ ] `claude_resolve_conflict` が `invoke_handler` マクロに追加されている
- [ ] 既存の 12 コマンドに加えて 13 番目として登録されている

**検証方法**:
```bash
grep "claude_resolve_conflict" src-tauri/src/lib.rs
```

---

### CHK-410 [P3] コード品質

- [ ] 重複コードがない（既存パターンの適切な再利用）
- [ ] 関数が単一責務である
- [ ] 不要な TODO やコメントアウトが残っていない

**検証方法**:
```bash
npm run lint
cargo clippy
```

---

## 5. テストレビュー

### CHK-501 [P1] Rust ユニットテスト: プロンプトビルダー

- [ ] `conflict_resolve_prompt.rs` のテストが存在する
- [ ] base / ours / theirs がプロンプトに含まれることを検証
- [ ] ファイルパス情報がプロンプトに含まれることを検証
- [ ] merged 結果のみを返すよう指示されていることを検証

**検証方法**:
```bash
cargo test conflict_resolve_prompt
```

---

### CHK-502 [P1] Rust ユニットテスト: UseCase

- [ ] `resolve_conflict` UseCase のテストが存在する
- [ ] モックリポジトリを使用している
- [ ] 成功ケース（`status: 'resolved'`）を検証
- [ ] 失敗ケース（`status: 'failed'`）を検証
- [ ] イベント送信（`app_handle.emit`）を検証

**検証方法**:
```bash
cargo test resolve_conflict
```

---

### CHK-503 [P1] Rust ユニットテスト: コマンドハンドラー

- [ ] `claude_resolve_conflict` コマンドのテストが存在する
- [ ] 引数の Deserialize が正しく動作することを検証

**検証方法**:
```bash
cargo test claude_resolve_conflict
```

---

### CHK-504 [P1] フロントエンド UseCase テスト

- [ ] `ResolveConflictUseCase` のテストが存在する
- [ ] モック Repository / Service を使用
- [ ] Service の `isResolvingConflict` 状態管理を検証
- [ ] エラー時の状態リセットを検証

**検証方法**:
```bash
npx vitest run src/features/claude-code-integration/application/usecases/__tests__/
```

---

### CHK-505 [P1] ViewModel テスト

- [ ] `ClaudeConflictViewModel` のテストが存在する
- [ ] `resolveConflict` メソッドのテスト
- [ ] `resolveAll` メソッドの 3 並列制御テスト
- [ ] 進捗トラッキング（total / completed / failed）の正確性テスト
- [ ] 一部失敗時の継続処理テスト

**検証方法**:
```bash
npx vitest run src/features/claude-code-integration/presentation/__tests__/
```

---

### CHK-506 [P2] コンポーネントテスト: AI ボタン

- [ ] ConflictResolver の AI ボタン表示テスト
- [ ] ボタンクリック時のコールバック呼び出しテスト
- [ ] Props 未指定時にボタンが非表示であるテスト

**検証方法**:
```bash
npx vitest run src/features/advanced-git-operations/presentation/__tests__/
```

---

### CHK-507 [P2] エッジケーステスト

- [ ] 空のコンフリクトファイルリストでの一括解決テスト
- [ ] 全ファイル失敗時の一括解決テスト
- [ ] AI 解決中にユーザーが別のファイルを選択した場合のテスト
- [ ] 同一ファイルに対する重複リクエストの防止テスト

**検証方法**:
```bash
npm run test
```

---

### CHK-508 [P2] テストカバレッジ

- [ ] Rust: `cargo test` で FR_506 関連テストが全てパス
- [ ] TypeScript: `npm run test` で FR_506 関連テストが全てパス
- [ ] カバレッジ >= 80%

**検証方法**:
```bash
cargo test 2>&1 | tail -5
npm run test 2>&1 | tail -10
```

**目標**: >=80% ラインカバレッジ

---

## 6. ドキュメントレビュー

### CHK-601 [P2] 設計書の更新

- [ ] `claude-code-integration_design.md` の実装進捗テーブルで FR_506 モジュールが 🟢 に更新されている
- [ ] `impl-status` が `implemented` に変更されている
- [ ] 変更履歴に FR_506 実装完了の記録がある

**検証方法**:
- 設計書の実装ステータスと実際のコードが一致することを確認

---

### CHK-602 [P2] Rust doc コメント

- [ ] 公開関数（`resolve_conflict` UseCase、コマンドハンドラー）に doc コメントがある
- [ ] プロンプトビルダーの関数に doc コメントがある

**検証方法**:
```bash
cargo doc --no-deps 2>&1 | grep warning
```

---

### CHK-603 [P3] コードコメント

- [ ] 複雑なロジック（3 並列制御、プロンプト構築）にコメントがある
- [ ] 不要な TODO が残っていない

**検証方法**:
- コードレビューで確認

---

## 7. セキュリティレビュー

### CHK-701 [P1] 入力バリデーション: worktreePath

- [ ] `worktreePath` が実在するディレクトリであることを検証
- [ ] パストラバーサル攻撃（`../` 等）を防止
- [ ] 既存の `claude_start_session` 等と同一のバリデーションを適用

**検証方法**:
- Rust 側のバリデーションコードを確認
- 不正パスでのテストケースを確認

**参照**: design § 10.2

---

### CHK-702 [P1] 入力バリデーション: filePath

- [ ] `filePath` に対するパストラバーサル攻撃の検証
- [ ] ワークツリー外のファイルパスを拒否

**検証方法**:
- 不正な `filePath` でのエラーハンドリングテストを確認

**参照**: design § 10.4

---

### CHK-703 [P1] DC_503: バックエンド実行制約

- [ ] Claude Code CLI のサブプロセス実行が Tauri Core (Rust) でのみ行われている
- [ ] Webview から `tokio::process::Command` を直接使用していない
- [ ] IPC 経由でバックエンドに委譲されている

**検証方法**:
```bash
# Webview 側に process 実行コードがないことを確認
grep -r "child_process\|exec\|spawn" src/features/claude-code-integration/ || echo "OK: no direct process execution"
```

**参照**: design § 2 設計目標 4

---

### CHK-704 [P1] CLI 出力の安全性

- [ ] AI が返した merged コンテンツに対して XSS 対策が施されている
- [ ] HTML エスケープまたは安全なレンダリングが行われている

**検証方法**:
- プレビュー表示のレンダリング方式を確認（Monaco Editor 使用の場合、エディタが自動でエスケープする）

**参照**: design § 10.3

---

### CHK-705 [P2] ソースコード送信の認識

- [ ] コンフリクトファイルの内容が外部 AI サービスに送信されることがユーザーに認識可能
- [ ] 初回利用時または設定画面で注意書きが表示される

**検証方法**:
- UI 上の注意表示を確認

**参照**: design § 10.4

---

## 8. パフォーマンスレビュー

### CHK-801 [P1] ワンショット実行のタイムアウト

- [ ] `claude -p` 実行にタイムアウトが設定されている
- [ ] タイムアウト時に `ConflictResolveResult { status: 'failed' }` を返す
- [ ] 既存のワンショット実行と同一のタイムアウト設定を使用

**検証方法**:
- Rust 側のタイムアウト設定を確認

---

### CHK-802 [P2] 3 並列制御のリソース消費

- [ ] 同時実行数 3 でシステムリソースが過大にならないことを確認
- [ ] 並列数を超えるリクエストがキューイングされていることを確認

**検証方法**:
- 10 ファイルコンフリクトで一括解決を実行し、リソース消費を確認

---

### CHK-803 [P2] UI レスポンス

- [ ] AI 解決ボタン押下後、即座にローディング状態が表示される
- [ ] プログレスバーの更新がリアルタイムで反映される
- [ ] UI がブロックされない（非同期処理）

**検証方法**:
- UI 操作時のレスポンスを目視確認

---

### CHK-804 [P3] 大規模ファイルの処理

- [ ] 大きなコンフリクトファイル（数千行）でもプロンプトが正常に構築される
- [ ] CLI の入力制限を超える場合のエラーハンドリングがある

**検証方法**:
- 大規模ファイルでのテストケースを確認

---

## 9. デプロイレビュー

### CHK-901 [P1] Tauri capabilities 設定

- [ ] `claude_resolve_conflict` コマンドが Tauri の capabilities/permissions に追加されている（必要な場合）
- [ ] 既存の claude コマンドと同一の capabilities を使用

**検証方法**:
```bash
grep "claude_resolve_conflict" src-tauri/capabilities/ 2>/dev/null || echo "Check if capabilities config needed"
```

---

### CHK-902 [P1] ビルド確認

- [ ] `npm run tauri:build` が成功する
- [ ] ビルドされたバイナリで AI コンフリクト解決機能が動作する

**検証方法**:
```bash
npm run tauri:build
```

---

### CHK-903 [P2] Claude Code CLI 互換性

- [ ] `claude -p` のワンショット実行が現在の Claude Code CLI バージョンで動作する
- [ ] 出力フォーマットのパースが正しく機能する

**検証方法**:
- 実環境で `claude -p` を手動実行し、出力形式を確認

---

## 完了基準

### PR 作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（31/31）
- [ ] `cargo test` が全てパス
- [ ] `npm run test` が全てパス
- [ ] `npm run typecheck` がパス
- [ ] `npm run lint` がパス
- [ ] `cargo clippy` がパス
- [ ] `/check-spec claude-code-integration` で整合性を検証

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（31/31）
- [ ] すべての P2 項目がチェック済み（21/21）
- [ ] コードレビュー承認済み
- [ ] CI/CD パイプライングリーン
- [ ] マージ準備完了

### リリース前チェックリスト

P3 までのすべての項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（31/31）
- [ ] すべての P2 項目がチェック済み（21/21）
- [ ] すべての P3 項目がチェック済み（3/3）
- [ ] 実環境での動作確認完了
- [ ] 本番デプロイ準備完了

---

## 参照ドキュメント

- PRD: [claude-code-integration.md](../../requirement/claude-code-integration.md)
- 抽象仕様書: [claude-code-integration_spec.md](../../specification/claude-code-integration_spec.md)
- 技術設計書: [claude-code-integration_design.md](../../specification/claude-code-integration_design.md)
- タスク分解: [tasks.md](./tasks.md)
