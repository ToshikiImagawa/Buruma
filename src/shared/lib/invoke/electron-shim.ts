/**
 * Electron 互換 `window.electronAPI` shim。
 *
 * Phase IA で導入され、Phase IH で削除される暫定レイヤー。既存の 14 caller が
 * `window.electronAPI.*` を呼び出すコードを触らずに Tauri `invoke`/`listen` に
 * ルーティングできるようにする。
 *
 * チャネル名変換ルール:
 * - Command: `:` と `-` を `_` に置換 (例 `repository:open-path` → `repository_open_path`)
 * - Event: `:` を `-` に置換 (例 `worktree:changed` → `worktree-changed`)
 * リファレンス: `.sdd/specification/tauri-migration_spec.md` L105-222 の全 83 チャネルマッピング表
 *
 * Phase IA では Rust 側に `ping` のみが実装されているため、他のチャネルは全て
 * `command X not found` 相当のエラーで failure を返す。shim は IPCResult 形状で
 * 統一するため、既存 caller の `if (result.success === false) ...` 分岐が正常動作し、
 * 起動時に描画されるトップ画面 (リポジトリ未選択) に合流する。
 */

import type { ElectronAPI, IPCError, IPCResult } from '@lib/ipc'

import { invokeCommand } from './commands'
import { listenEventSync } from './events'

/**
 * `window.electronAPI` を合成して window に注入する。
 *
 * - Tauri ランタイム (`__TAURI_INTERNALS__` グローバル) が存在する場合のみ install
 * - vitest/jsdom では `__TAURI_INTERNALS__` が undefined なので no-op
 *   (既存テストは引き続き `Object.defineProperty(window, 'electronAPI', ...)` で
 *    独自モックを注入できる)
 * - 二重 install 防止のため `window.electronAPI` が既に存在する場合は何もしない
 */
export function installElectronShim(): void {
  if (typeof window === 'undefined') return
  if (!('__TAURI_INTERNALS__' in window)) return
  if ((window as { electronAPI?: ElectronAPI }).electronAPI) return
  ;(window as unknown as { electronAPI: ElectronAPI }).electronAPI = buildShim()
}

function buildShim(): ElectronAPI {
  return {
    repository: {
      open: () => invokeCommand('repository_open'),
      openByPath: (path) => invokeCommand('repository_open_path', { path }),
      validate: (path) => invokeCommand('repository_validate', { path }),
      getRecent: () => invokeCommand('repository_get_recent'),
      removeRecent: (path) => invokeCommand('repository_remove_recent', { path }),
      pin: (path, pinned) => invokeCommand('repository_pin', { path, pinned }),
    },
    settings: {
      get: () => invokeCommand('settings_get'),
      set: (settings) => invokeCommand('settings_set', { settings }),
      getTheme: () => invokeCommand('settings_get_theme'),
      setTheme: (theme) => invokeCommand('settings_set_theme', { theme }),
    },
    onError: (cb) => listenEventSync('error-notify', cb),
    worktree: {
      list: (repoPath) => invokeCommand('worktree_list', { repoPath }),
      status: (repoPath, worktreePath) => invokeCommand('worktree_status', { repoPath, worktreePath }),
      create: (params) => invokeCommand('worktree_create', { params }),
      delete: (params) => invokeCommand('worktree_delete', { params }),
      suggestPath: (repoPath, branch) => invokeCommand('worktree_suggest_path', { repoPath, branch }),
      checkDirty: (worktreePath) => invokeCommand('worktree_check_dirty', { worktreePath }),
      defaultBranch: (repoPath) => invokeCommand('worktree_default_branch', { repoPath }),
      onChanged: (cb) => listenEventSync('worktree-changed', cb),
    },
    git: {
      // repository-viewer (10)
      status: (args) => invokeCommand('git_status', { args }),
      log: (query) => invokeCommand('git_log', { query }),
      commitDetail: (args) => invokeCommand('git_commit_detail', { args }),
      diff: (query) => invokeCommand('git_diff', { query }),
      diffStaged: (query) => invokeCommand('git_diff_staged', { query }),
      diffCommit: (args) => invokeCommand('git_diff_commit', { args }),
      branches: (args) => invokeCommand('git_branches', { args }),
      fileTree: (args) => invokeCommand('git_file_tree', { args }),
      fileContents: (args) => invokeCommand('git_file_contents', { args }),
      fileContentsCommit: (args) => invokeCommand('git_file_contents_commit', { args }),
      // basic-git-operations (12)
      stage: (args) => invokeCommand('git_stage', { args }),
      stageAll: (args) => invokeCommand('git_stage_all', { args }),
      unstage: (args) => invokeCommand('git_unstage', { args }),
      unstageAll: (args) => invokeCommand('git_unstage_all', { args }),
      commit: (args) => invokeCommand('git_commit', { args }),
      push: (args) => invokeCommand('git_push', { args }),
      pull: (args) => invokeCommand('git_pull', { args }),
      fetch: (args) => invokeCommand('git_fetch', { args }),
      branchCreate: (args) => invokeCommand('git_branch_create', { args }),
      branchCheckout: (args) => invokeCommand('git_branch_checkout', { args }),
      branchDelete: (args) => invokeCommand('git_branch_delete', { args }),
      reset: (args) => invokeCommand('git_reset', { args }),
      onProgress: (cb) => listenEventSync('git-progress', cb),
      // advanced-git-operations (24)
      merge: (args) => invokeCommand('git_merge', { args }),
      mergeAbort: (args) => invokeCommand('git_merge_abort', { args }),
      mergeStatus: (args) => invokeCommand('git_merge_status', { args }),
      rebase: (args) => invokeCommand('git_rebase', { args }),
      rebaseInteractive: (args) => invokeCommand('git_rebase_interactive', { args }),
      rebaseAbort: (args) => invokeCommand('git_rebase_abort', { args }),
      rebaseContinue: (args) => invokeCommand('git_rebase_continue', { args }),
      rebaseGetCommits: (args) => invokeCommand('git_rebase_get_commits', { args }),
      stashSave: (args) => invokeCommand('git_stash_save', { args }),
      stashList: (args) => invokeCommand('git_stash_list', { args }),
      stashPop: (args) => invokeCommand('git_stash_pop', { args }),
      stashApply: (args) => invokeCommand('git_stash_apply', { args }),
      stashDrop: (args) => invokeCommand('git_stash_drop', { args }),
      stashClear: (args) => invokeCommand('git_stash_clear', { args }),
      cherryPick: (args) => invokeCommand('git_cherry_pick', { args }),
      cherryPickAbort: (args) => invokeCommand('git_cherry_pick_abort', { args }),
      conflictList: (args) => invokeCommand('git_conflict_list', { args }),
      conflictFileContent: (args) => invokeCommand('git_conflict_file_content', { args }),
      conflictResolve: (args) => invokeCommand('git_conflict_resolve', { args }),
      conflictResolveAll: (args) => invokeCommand('git_conflict_resolve_all', { args }),
      conflictMarkResolved: (args) => invokeCommand('git_conflict_mark_resolved', { args }),
      tagList: (args) => invokeCommand('git_tag_list', { args }),
      tagCreate: (args) => invokeCommand('git_tag_create', { args }),
      tagDelete: (args) => invokeCommand('git_tag_delete', { args }),
    },
    claude: {
      startSession: (args) => invokeCommand('claude_start_session', { args }),
      stopSession: (args) => invokeCommand('claude_stop_session', { args }),
      getSession: (args) => invokeCommand('claude_get_session', { args }),
      getAllSessions: () => invokeCommand('claude_get_all_sessions'),
      sendCommand: (command) => invokeCommand('claude_send_command', { command }),
      getOutput: (args) => invokeCommand('claude_get_output', { args }),
      checkAuth: () => invokeCommand('claude_check_auth'),
      login: () => invokeCommand('claude_login'),
      logout: () => invokeCommand('claude_logout'),
      reviewDiff: (args) => invokeCommand('claude_review_diff', { args }),
      explainDiff: (args) => invokeCommand('claude_explain_diff', { args }),
      onOutput: (cb) => listenEventSync('claude-output', cb),
      onSessionChanged: (cb) => listenEventSync('claude-session-changed', cb),
      onCommandCompleted: (cb) => listenEventSync('claude-command-completed', cb),
      onReviewResult: (cb) => listenEventSync('claude-review-result', cb),
      onExplainResult: (cb) => listenEventSync('claude-explain-result', cb),
      generateCommitMessage: (args) => invokeCommand('claude_generate_commit_message', { args }),
    },
  }
}

// IPCResult/IPCError を明示 import してもらうための再 export (他モジュールで使う場合の導線)
export type { IPCError, IPCResult }
