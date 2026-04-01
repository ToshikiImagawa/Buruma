/**
 * IPC 通信の共有型定義
 */

/** IPC 通信の統一レスポンス型 */
export type IPCResult<T> = { success: true; data: T } | { success: false; error: IPCError }

/** IPC エラー情報 */
export interface IPCError {
  code: string
  message: string
  detail?: string
}

/** IPCResult 成功値を生成するヘルパー */
export function ipcSuccess<T>(data: T): IPCResult<T> {
  return { success: true, data }
}

/** IPCResult 失敗値を生成するヘルパー */
export function ipcFailure<T>(code: string, message: string, detail?: string): IPCResult<T> {
  return { success: false, error: { code, message, detail } }
}

/**
 * IPC チャネル定義
 * renderer → main (invoke/handle)
 */
export interface IPCChannelMap {
  'repository:open': {
    args: []
    result: IPCResult<import('../domain').RepositoryInfo | null>
  }
  'repository:open-path': {
    args: [string]
    result: IPCResult<import('../domain').RepositoryInfo | null>
  }
  'repository:validate': { args: [string]; result: IPCResult<boolean> }
  'repository:get-recent': {
    args: []
    result: IPCResult<import('../domain').RecentRepository[]>
  }
  'repository:remove-recent': { args: [string]; result: IPCResult<void> }
  'repository:pin': { args: [{ path: string; pinned: boolean }]; result: IPCResult<void> }
  'settings:get': { args: []; result: IPCResult<import('../domain').AppSettings> }
  'settings:set': {
    args: [Partial<import('../domain').AppSettings>]
    result: IPCResult<void>
  }
  'settings:get-theme': { args: []; result: IPCResult<import('../domain').Theme> }
  'settings:set-theme': { args: [import('../domain').Theme]; result: IPCResult<void> }
  // worktree channels
  'worktree:list': { args: [string]; result: IPCResult<import('../domain').WorktreeInfo[]> }
  'worktree:status': {
    args: [{ repoPath: string; worktreePath: string }]
    result: IPCResult<import('../domain').WorktreeStatus>
  }
  'worktree:create': {
    args: [import('../domain').WorktreeCreateParams]
    result: IPCResult<import('../domain').WorktreeInfo>
  }
  'worktree:delete': { args: [import('../domain').WorktreeDeleteParams]; result: IPCResult<void> }
  'worktree:suggest-path': {
    args: [{ repoPath: string; branch: string }]
    result: IPCResult<string>
  }
  'worktree:check-dirty': { args: [string]; result: IPCResult<boolean> }
  'worktree:default-branch': { args: [string]; result: IPCResult<string> }
  // git channels (repository-viewer)
  'git:status': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('../domain').GitStatus>
  }
  'git:log': {
    args: [import('../domain').GitLogQuery]
    result: IPCResult<import('../domain').GitLogResult>
  }
  'git:commit-detail': {
    args: [{ worktreePath: string; hash: string }]
    result: IPCResult<import('../domain').CommitDetail>
  }
  'git:diff': {
    args: [import('../domain').GitDiffQuery]
    result: IPCResult<import('../domain').FileDiff[]>
  }
  'git:diff-staged': {
    args: [import('../domain').GitDiffQuery]
    result: IPCResult<import('../domain').FileDiff[]>
  }
  'git:diff-commit': {
    args: [{ worktreePath: string; hash: string; filePath?: string }]
    result: IPCResult<import('../domain').FileDiff[]>
  }
  'git:branches': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('../domain').BranchList>
  }
  'git:file-tree': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('../domain').FileTreeNode>
  }
  'git:file-contents': {
    args: [{ worktreePath: string; filePath: string; staged?: boolean }]
    result: IPCResult<import('../domain').FileContents>
  }
  'git:file-contents-commit': {
    args: [{ worktreePath: string; hash: string; filePath: string }]
    result: IPCResult<import('../domain').FileContents>
  }
}

/** main → renderer イベント */
export interface IPCEventMap {
  'error:notify': import('../domain').ErrorNotification
  'worktree:changed': import('../domain').WorktreeChangeEvent
}

/** Preload API 型（contextBridge 経由で公開） */
export interface ElectronAPI {
  repository: {
    open(): Promise<IPCResult<import('../domain').RepositoryInfo | null>>
    openByPath(path: string): Promise<IPCResult<import('../domain').RepositoryInfo | null>>
    validate(path: string): Promise<IPCResult<boolean>>
    getRecent(): Promise<IPCResult<import('../domain').RecentRepository[]>>
    removeRecent(path: string): Promise<IPCResult<void>>
    pin(path: string, pinned: boolean): Promise<IPCResult<void>>
  }
  settings: {
    get(): Promise<IPCResult<import('../domain').AppSettings>>
    set(settings: Partial<import('../domain').AppSettings>): Promise<IPCResult<void>>
    getTheme(): Promise<IPCResult<import('../domain').Theme>>
    setTheme(theme: import('../domain').Theme): Promise<IPCResult<void>>
  }
  onError(callback: (notification: import('../domain').ErrorNotification) => void): () => void
  worktree: {
    list(repoPath: string): Promise<IPCResult<import('../domain').WorktreeInfo[]>>
    status(repoPath: string, worktreePath: string): Promise<IPCResult<import('../domain').WorktreeStatus>>
    create(params: import('../domain').WorktreeCreateParams): Promise<IPCResult<import('../domain').WorktreeInfo>>
    delete(params: import('../domain').WorktreeDeleteParams): Promise<IPCResult<void>>
    suggestPath(repoPath: string, branch: string): Promise<IPCResult<string>>
    checkDirty(worktreePath: string): Promise<IPCResult<boolean>>
    defaultBranch(repoPath: string): Promise<IPCResult<string>>
    onChanged(callback: (event: import('../domain').WorktreeChangeEvent) => void): () => void
  }
  git: {
    status(args: { worktreePath: string }): Promise<IPCResult<import('../domain').GitStatus>>
    log(query: import('../domain').GitLogQuery): Promise<IPCResult<import('../domain').GitLogResult>>
    commitDetail(args: { worktreePath: string; hash: string }): Promise<IPCResult<import('../domain').CommitDetail>>
    diff(query: import('../domain').GitDiffQuery): Promise<IPCResult<import('../domain').FileDiff[]>>
    diffStaged(query: import('../domain').GitDiffQuery): Promise<IPCResult<import('../domain').FileDiff[]>>
    diffCommit(args: {
      worktreePath: string
      hash: string
      filePath?: string
    }): Promise<IPCResult<import('../domain').FileDiff[]>>
    branches(args: { worktreePath: string }): Promise<IPCResult<import('../domain').BranchList>>
    fileTree(args: { worktreePath: string }): Promise<IPCResult<import('../domain').FileTreeNode>>
    fileContents(args: {
      worktreePath: string
      filePath: string
      staged?: boolean
    }): Promise<IPCResult<import('../domain').FileContents>>
    fileContentsCommit(args: {
      worktreePath: string
      hash: string
      filePath: string
    }): Promise<IPCResult<import('../domain').FileContents>>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
