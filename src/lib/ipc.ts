/**
 * IPC 通信の共有型定義
 *
 * IPCCommandMap / IPCEventMap は Rust #[tauri::command] / emit と 1:1 で手動同期している。
 * Phase 2 以降で specta / tauri-specta による自動生成に置き換え予定。
 */

import type {
  AppSettings,
  BranchCheckoutArgs,
  BranchCreateArgs,
  BranchDeleteArgs,
  BranchDeleteResult,
  BranchList,
  CherryPickOptions,
  CherryPickResult,
  ClaudeAuthStatus,
  ClaudeCommand,
  ClaudeOutput,
  ClaudeSession,
  CommitArgs,
  CommitDetail,
  CommitResult,
  ConflictFile,
  ConflictResolveAIRequest,
  ConflictResolveAllOptions,
  ConflictResolveOptions,
  ConflictResolveResult,
  DiffTarget,
  ErrorNotification,
  ExplainResult,
  FetchArgs,
  FetchResult,
  FileContents,
  FileDiff,
  FileTreeNode,
  GitDiffQuery,
  GitLogQuery,
  GitLogResult,
  GitProgressEvent,
  GitStatus,
  InteractiveRebaseOptions,
  MergeOptions,
  MergeResult,
  MergeStatus,
  PullArgs,
  PullResult,
  PushArgs,
  PushResult,
  RebaseOptions,
  RebaseResult,
  RebaseStep,
  RecentRepository,
  RepositoryInfo,
  ResetArgs,
  ReviewResult,
  StashEntry,
  StashSaveOptions,
  SymlinkConfig,
  TagCreateOptions,
  TagInfo,
  Theme,
  ThreeWayContent,
  WorktreeChangeEvent,
  WorktreeCreateParams,
  WorktreeCreateResult,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeStatus,
} from '@domain'

/** IPC 通信の統一レスポンス型 */
export type IPCResult<T> = { success: true; data: T } | { success: false; error: IPCError }

/** IPC エラー情報 */
export interface IPCError {
  code: string
  message: string
  detail?: string
}

/**
 * Tauri command 名 → 引数型・戻り値型のマッピング。
 * args は invokeCommand の第 2 引数としてそのまま渡される wire format。
 */
export interface IPCCommandMap {
  // --- application-foundation: repository ---
  repository_open: { args: void; result: RepositoryInfo | null }
  repository_open_path: { args: { path: string }; result: RepositoryInfo | null }
  repository_validate: { args: { path: string }; result: boolean }
  repository_get_recent: { args: void; result: RecentRepository[] }
  repository_remove_recent: { args: { path: string }; result: void }
  repository_pin: { args: { path: string; pinned: boolean }; result: void }

  // --- application-foundation: settings ---
  settings_get: { args: void; result: AppSettings }
  settings_set: { args: { settings: Partial<AppSettings> }; result: void }
  settings_get_theme: { args: void; result: Theme }
  settings_set_theme: { args: { theme: Theme }; result: void }

  // --- repository-viewer ---
  git_status: { args: { args: { worktreePath: string } }; result: GitStatus }
  git_log: { args: { query: GitLogQuery }; result: GitLogResult }
  git_commit_detail: { args: { args: { worktreePath: string; hash: string } }; result: CommitDetail }
  git_diff: { args: { query: GitDiffQuery }; result: FileDiff[] }
  git_diff_staged: { args: { query: GitDiffQuery }; result: FileDiff[] }
  git_diff_commit: {
    args: { args: { worktreePath: string; hash: string; filePath?: string } }
    result: FileDiff[]
  }
  git_branches: { args: { args: { worktreePath: string } }; result: BranchList }
  git_file_tree: { args: { args: { worktreePath: string } }; result: FileTreeNode }
  git_file_contents: {
    args: { args: { worktreePath: string; filePath: string; staged: boolean } }
    result: FileContents
  }
  git_file_contents_commit: {
    args: { args: { worktreePath: string; hash: string; filePath: string } }
    result: FileContents
  }

  // --- basic-git-operations ---
  git_stage: { args: { args: { worktreePath: string; files: string[] } }; result: void }
  git_stage_all: { args: { args: { worktreePath: string } }; result: void }
  git_unstage: { args: { args: { worktreePath: string; files: string[] } }; result: void }
  git_unstage_all: { args: { args: { worktreePath: string } }; result: void }
  git_commit: { args: { args: CommitArgs }; result: CommitResult }
  git_push: { args: { args: PushArgs }; result: PushResult }
  git_pull: { args: { args: PullArgs }; result: PullResult }
  git_fetch: { args: { args: FetchArgs }; result: FetchResult }
  git_branch_create: { args: { args: BranchCreateArgs }; result: void }
  git_branch_checkout: { args: { args: BranchCheckoutArgs }; result: void }
  git_branch_delete: { args: { args: BranchDeleteArgs }; result: void }
  git_reset: { args: { args: ResetArgs }; result: void }

  // --- advanced-git-operations ---
  git_merge: { args: { args: MergeOptions }; result: MergeResult }
  git_merge_abort: { args: { args: { worktreePath: string } }; result: void }
  git_merge_status: { args: { args: { worktreePath: string } }; result: MergeStatus }
  git_rebase: { args: { args: RebaseOptions }; result: RebaseResult }
  git_rebase_interactive: { args: { args: InteractiveRebaseOptions }; result: RebaseResult }
  git_rebase_abort: { args: { args: { worktreePath: string } }; result: void }
  git_rebase_continue: { args: { args: { worktreePath: string } }; result: RebaseResult }
  git_rebase_get_commits: { args: { args: { worktreePath: string; onto: string } }; result: RebaseStep[] }
  git_stash_save: { args: { args: StashSaveOptions }; result: void }
  git_stash_list: { args: { args: { worktreePath: string } }; result: StashEntry[] }
  git_stash_pop: { args: { args: { worktreePath: string; index: number } }; result: void }
  git_stash_apply: { args: { args: { worktreePath: string; index: number } }; result: void }
  git_stash_drop: { args: { args: { worktreePath: string; index: number } }; result: void }
  git_stash_clear: { args: { args: { worktreePath: string } }; result: void }
  git_cherry_pick: { args: { args: CherryPickOptions }; result: CherryPickResult }
  git_cherry_pick_abort: { args: { args: { worktreePath: string } }; result: void }
  git_conflict_list: { args: { args: { worktreePath: string } }; result: ConflictFile[] }
  git_conflict_file_content: {
    args: { args: { worktreePath: string; filePath: string } }
    result: ThreeWayContent
  }
  git_conflict_resolve: { args: { args: ConflictResolveOptions }; result: void }
  git_conflict_resolve_all: { args: { args: ConflictResolveAllOptions }; result: void }
  git_conflict_mark_resolved: { args: { args: { worktreePath: string; filePath: string } }; result: void }
  git_tag_list: { args: { args: { worktreePath: string } }; result: TagInfo[] }
  git_tag_create: { args: { args: TagCreateOptions }; result: void }
  git_tag_delete: { args: { args: { worktreePath: string; tagName: string } }; result: void }

  // --- worktree-management ---
  worktree_list: { args: { repoPath: string }; result: WorktreeInfo[] }
  worktree_status: { args: { repoPath: string; worktreePath: string }; result: WorktreeStatus }
  worktree_create: { args: { params: WorktreeCreateParams }; result: WorktreeCreateResult }
  worktree_delete: { args: { params: WorktreeDeleteParams }; result: BranchDeleteResult | null }
  worktree_suggest_path: { args: { repoPath: string; branch: string }; result: string }
  worktree_check_dirty: { args: { worktreePath: string }; result: boolean }
  worktree_default_branch: { args: { repoPath: string }; result: string }
  worktree_symlink_config_get: { args: { repoPath: string }; result: SymlinkConfig }
  worktree_symlink_config_set: { args: { repoPath: string; config: SymlinkConfig }; result: void }

  // --- claude-code-integration ---
  claude_start_session: { args: { args: { worktreePath: string } }; result: ClaudeSession }
  claude_stop_session: { args: { args: { worktreePath: string } }; result: void }
  claude_get_session: { args: { args: { worktreePath: string } }; result: ClaudeSession | null }
  claude_get_all_sessions: { args: void; result: ClaudeSession[] }
  claude_send_command: { args: { command: ClaudeCommand }; result: void }
  claude_get_output: { args: { args: { worktreePath: string } }; result: ClaudeOutput[] }
  claude_review_diff: {
    args: { args: { worktreePath: string; diffTarget: DiffTarget; diffText: string } }
    result: void
  }
  claude_explain_diff: {
    args: { args: { worktreePath: string; diffTarget: DiffTarget; diffText: string } }
    result: void
  }
  claude_generate_commit_message: {
    args: { args: { worktreePath: string; diffText: string; rules?: string | null } }
    result: string
  }
  claude_resolve_conflict: {
    args: { args: ConflictResolveAIRequest }
    result: void
  }
  claude_check_auth: { args: void; result: ClaudeAuthStatus }
  claude_login: { args: void; result: void }
  claude_logout: { args: void; result: void }
}

/** Tauri event 名 → ペイロード型のマッピング */
export interface IPCEventMap {
  'error-notify': ErrorNotification
  'worktree-changed': WorktreeChangeEvent
  'git-progress': GitProgressEvent
  'claude-output': ClaudeOutput
  'claude-session-changed': ClaudeSession
  'claude-command-completed': { worktreePath: string }
  'claude-review-result': ReviewResult
  'claude-explain-result': ExplainResult
  'claude-conflict-resolved': ConflictResolveResult
}
