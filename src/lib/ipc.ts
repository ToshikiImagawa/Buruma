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
    result: IPCResult<import('@domain').RepositoryInfo | null>
  }
  'repository:open-path': {
    args: [string]
    result: IPCResult<import('@domain').RepositoryInfo | null>
  }
  'repository:validate': { args: [string]; result: IPCResult<boolean> }
  'repository:get-recent': {
    args: []
    result: IPCResult<import('@domain').RecentRepository[]>
  }
  'repository:remove-recent': { args: [string]; result: IPCResult<void> }
  'repository:pin': { args: [{ path: string; pinned: boolean }]; result: IPCResult<void> }
  'settings:get': { args: []; result: IPCResult<import('@domain').AppSettings> }
  'settings:set': {
    args: [Partial<import('@domain').AppSettings>]
    result: IPCResult<void>
  }
  'settings:get-theme': { args: []; result: IPCResult<import('@domain').Theme> }
  'settings:set-theme': { args: [import('@domain').Theme]; result: IPCResult<void> }
  // worktree channels
  'worktree:list': { args: [string]; result: IPCResult<import('@domain').WorktreeInfo[]> }
  'worktree:status': {
    args: [{ repoPath: string; worktreePath: string }]
    result: IPCResult<import('@domain').WorktreeStatus>
  }
  'worktree:create': {
    args: [import('@domain').WorktreeCreateParams]
    result: IPCResult<import('@domain').WorktreeInfo>
  }
  'worktree:delete': { args: [import('@domain').WorktreeDeleteParams]; result: IPCResult<void> }
  'worktree:suggest-path': {
    args: [{ repoPath: string; branch: string }]
    result: IPCResult<string>
  }
  'worktree:check-dirty': { args: [string]; result: IPCResult<boolean> }
  'worktree:default-branch': { args: [string]; result: IPCResult<string> }
  // git channels (repository-viewer)
  'git:status': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').GitStatus>
  }
  'git:log': {
    args: [import('@domain').GitLogQuery]
    result: IPCResult<import('@domain').GitLogResult>
  }
  'git:commit-detail': {
    args: [{ worktreePath: string; hash: string }]
    result: IPCResult<import('@domain').CommitDetail>
  }
  'git:diff': {
    args: [import('@domain').GitDiffQuery]
    result: IPCResult<import('@domain').FileDiff[]>
  }
  'git:diff-staged': {
    args: [import('@domain').GitDiffQuery]
    result: IPCResult<import('@domain').FileDiff[]>
  }
  'git:diff-commit': {
    args: [{ worktreePath: string; hash: string; filePath?: string }]
    result: IPCResult<import('@domain').FileDiff[]>
  }
  'git:branches': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').BranchList>
  }
  'git:file-tree': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').FileTreeNode>
  }
  'git:file-contents': {
    args: [{ worktreePath: string; filePath: string; staged?: boolean }]
    result: IPCResult<import('@domain').FileContents>
  }
  'git:file-contents-commit': {
    args: [{ worktreePath: string; hash: string; filePath: string }]
    result: IPCResult<import('@domain').FileContents>
  }
  // basic-git-operations channels
  'git:stage': {
    args: [{ worktreePath: string; files: string[] }]
    result: IPCResult<void>
  }
  'git:stage-all': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:unstage': {
    args: [{ worktreePath: string; files: string[] }]
    result: IPCResult<void>
  }
  'git:unstage-all': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:commit': {
    args: [import('@domain').CommitArgs]
    result: IPCResult<import('@domain').CommitResult>
  }
  'git:push': {
    args: [import('@domain').PushArgs]
    result: IPCResult<import('@domain').PushResult>
  }
  'git:pull': {
    args: [import('@domain').PullArgs]
    result: IPCResult<import('@domain').PullResult>
  }
  'git:fetch': {
    args: [import('@domain').FetchArgs]
    result: IPCResult<import('@domain').FetchResult>
  }
  'git:branch-create': {
    args: [import('@domain').BranchCreateArgs]
    result: IPCResult<void>
  }
  'git:branch-checkout': {
    args: [import('@domain').BranchCheckoutArgs]
    result: IPCResult<void>
  }
  'git:branch-delete': {
    args: [import('@domain').BranchDeleteArgs]
    result: IPCResult<void>
  }
  // advanced-git-operations channels
  'git:merge': {
    args: [import('@domain').MergeOptions]
    result: IPCResult<import('@domain').MergeResult>
  }
  'git:merge-abort': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:merge-status': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').MergeStatus>
  }
  'git:rebase': {
    args: [import('@domain').RebaseOptions]
    result: IPCResult<import('@domain').RebaseResult>
  }
  'git:rebase-interactive': {
    args: [import('@domain').InteractiveRebaseOptions]
    result: IPCResult<import('@domain').RebaseResult>
  }
  'git:rebase-abort': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:rebase-continue': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').RebaseResult>
  }
  'git:rebase-get-commits': {
    args: [{ worktreePath: string; onto: string }]
    result: IPCResult<import('@domain').RebaseStep[]>
  }
  'git:stash-save': {
    args: [import('@domain').StashSaveOptions]
    result: IPCResult<void>
  }
  'git:stash-list': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').StashEntry[]>
  }
  'git:stash-pop': {
    args: [{ worktreePath: string; index: number }]
    result: IPCResult<void>
  }
  'git:stash-apply': {
    args: [{ worktreePath: string; index: number }]
    result: IPCResult<void>
  }
  'git:stash-drop': {
    args: [{ worktreePath: string; index: number }]
    result: IPCResult<void>
  }
  'git:stash-clear': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:cherry-pick': {
    args: [import('@domain').CherryPickOptions]
    result: IPCResult<import('@domain').CherryPickResult>
  }
  'git:cherry-pick-abort': {
    args: [{ worktreePath: string }]
    result: IPCResult<void>
  }
  'git:conflict-list': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').ConflictFile[]>
  }
  'git:conflict-file-content': {
    args: [{ worktreePath: string; filePath: string }]
    result: IPCResult<import('@domain').ThreeWayContent>
  }
  'git:conflict-resolve': {
    args: [import('@domain').ConflictResolveOptions]
    result: IPCResult<void>
  }
  'git:conflict-resolve-all': {
    args: [import('@domain').ConflictResolveAllOptions]
    result: IPCResult<void>
  }
  'git:conflict-mark-resolved': {
    args: [{ worktreePath: string; filePath: string }]
    result: IPCResult<void>
  }
  'git:tag-list': {
    args: [{ worktreePath: string }]
    result: IPCResult<import('@domain').TagInfo[]>
  }
  'git:tag-create': {
    args: [import('@domain').TagCreateOptions]
    result: IPCResult<void>
  }
  'git:tag-delete': {
    args: [{ worktreePath: string; tagName: string }]
    result: IPCResult<void>
  }
}

/** main → renderer イベント */
export interface IPCEventMap {
  'error:notify': import('@domain').ErrorNotification
  'worktree:changed': import('@domain').WorktreeChangeEvent
  'git:progress': import('@domain').GitProgressEvent
}

/** Preload API 型（contextBridge 経由で公開） */
export interface ElectronAPI {
  repository: {
    open(): Promise<IPCResult<import('@domain').RepositoryInfo | null>>
    openByPath(path: string): Promise<IPCResult<import('@domain').RepositoryInfo | null>>
    validate(path: string): Promise<IPCResult<boolean>>
    getRecent(): Promise<IPCResult<import('@domain').RecentRepository[]>>
    removeRecent(path: string): Promise<IPCResult<void>>
    pin(path: string, pinned: boolean): Promise<IPCResult<void>>
  }
  settings: {
    get(): Promise<IPCResult<import('@domain').AppSettings>>
    set(settings: Partial<import('@domain').AppSettings>): Promise<IPCResult<void>>
    getTheme(): Promise<IPCResult<import('@domain').Theme>>
    setTheme(theme: import('@domain').Theme): Promise<IPCResult<void>>
  }
  onError(callback: (notification: import('@domain').ErrorNotification) => void): () => void
  worktree: {
    list(repoPath: string): Promise<IPCResult<import('@domain').WorktreeInfo[]>>
    status(repoPath: string, worktreePath: string): Promise<IPCResult<import('@domain').WorktreeStatus>>
    create(params: import('@domain').WorktreeCreateParams): Promise<IPCResult<import('@domain').WorktreeInfo>>
    delete(params: import('@domain').WorktreeDeleteParams): Promise<IPCResult<void>>
    suggestPath(repoPath: string, branch: string): Promise<IPCResult<string>>
    checkDirty(worktreePath: string): Promise<IPCResult<boolean>>
    defaultBranch(repoPath: string): Promise<IPCResult<string>>
    onChanged(callback: (event: import('@domain').WorktreeChangeEvent) => void): () => void
  }
  git: {
    status(args: { worktreePath: string }): Promise<IPCResult<import('@domain').GitStatus>>
    log(query: import('@domain').GitLogQuery): Promise<IPCResult<import('@domain').GitLogResult>>
    commitDetail(args: { worktreePath: string; hash: string }): Promise<IPCResult<import('@domain').CommitDetail>>
    diff(query: import('@domain').GitDiffQuery): Promise<IPCResult<import('@domain').FileDiff[]>>
    diffStaged(query: import('@domain').GitDiffQuery): Promise<IPCResult<import('@domain').FileDiff[]>>
    diffCommit(args: {
      worktreePath: string
      hash: string
      filePath?: string
    }): Promise<IPCResult<import('@domain').FileDiff[]>>
    branches(args: { worktreePath: string }): Promise<IPCResult<import('@domain').BranchList>>
    fileTree(args: { worktreePath: string }): Promise<IPCResult<import('@domain').FileTreeNode>>
    fileContents(args: {
      worktreePath: string
      filePath: string
      staged?: boolean
    }): Promise<IPCResult<import('@domain').FileContents>>
    fileContentsCommit(args: {
      worktreePath: string
      hash: string
      filePath: string
    }): Promise<IPCResult<import('@domain').FileContents>>
    // basic-git-operations
    stage(args: { worktreePath: string; files: string[] }): Promise<IPCResult<void>>
    stageAll(args: { worktreePath: string }): Promise<IPCResult<void>>
    unstage(args: { worktreePath: string; files: string[] }): Promise<IPCResult<void>>
    unstageAll(args: { worktreePath: string }): Promise<IPCResult<void>>
    commit(args: import('@domain').CommitArgs): Promise<IPCResult<import('@domain').CommitResult>>
    push(args: import('@domain').PushArgs): Promise<IPCResult<import('@domain').PushResult>>
    pull(args: import('@domain').PullArgs): Promise<IPCResult<import('@domain').PullResult>>
    fetch(args: import('@domain').FetchArgs): Promise<IPCResult<import('@domain').FetchResult>>
    branchCreate(args: import('@domain').BranchCreateArgs): Promise<IPCResult<void>>
    branchCheckout(args: import('@domain').BranchCheckoutArgs): Promise<IPCResult<void>>
    branchDelete(args: import('@domain').BranchDeleteArgs): Promise<IPCResult<void>>
    onProgress(callback: (event: import('@domain').GitProgressEvent) => void): () => void
    // advanced-git-operations
    merge(args: import('@domain').MergeOptions): Promise<IPCResult<import('@domain').MergeResult>>
    mergeAbort(args: { worktreePath: string }): Promise<IPCResult<void>>
    mergeStatus(args: { worktreePath: string }): Promise<IPCResult<import('@domain').MergeStatus>>
    rebase(args: import('@domain').RebaseOptions): Promise<IPCResult<import('@domain').RebaseResult>>
    rebaseInteractive(
      args: import('@domain').InteractiveRebaseOptions,
    ): Promise<IPCResult<import('@domain').RebaseResult>>
    rebaseAbort(args: { worktreePath: string }): Promise<IPCResult<void>>
    rebaseContinue(args: { worktreePath: string }): Promise<IPCResult<import('@domain').RebaseResult>>
    rebaseGetCommits(args: {
      worktreePath: string
      onto: string
    }): Promise<IPCResult<import('@domain').RebaseStep[]>>
    stashSave(args: import('@domain').StashSaveOptions): Promise<IPCResult<void>>
    stashList(args: { worktreePath: string }): Promise<IPCResult<import('@domain').StashEntry[]>>
    stashPop(args: { worktreePath: string; index: number }): Promise<IPCResult<void>>
    stashApply(args: { worktreePath: string; index: number }): Promise<IPCResult<void>>
    stashDrop(args: { worktreePath: string; index: number }): Promise<IPCResult<void>>
    stashClear(args: { worktreePath: string }): Promise<IPCResult<void>>
    cherryPick(
      args: import('@domain').CherryPickOptions,
    ): Promise<IPCResult<import('@domain').CherryPickResult>>
    cherryPickAbort(args: { worktreePath: string }): Promise<IPCResult<void>>
    conflictList(args: { worktreePath: string }): Promise<IPCResult<import('@domain').ConflictFile[]>>
    conflictFileContent(args: {
      worktreePath: string
      filePath: string
    }): Promise<IPCResult<import('@domain').ThreeWayContent>>
    conflictResolve(args: import('@domain').ConflictResolveOptions): Promise<IPCResult<void>>
    conflictResolveAll(args: import('@domain').ConflictResolveAllOptions): Promise<IPCResult<void>>
    conflictMarkResolved(args: { worktreePath: string; filePath: string }): Promise<IPCResult<void>>
    tagList(args: { worktreePath: string }): Promise<IPCResult<import('@domain').TagInfo[]>>
    tagCreate(args: import('@domain').TagCreateOptions): Promise<IPCResult<void>>
    tagDelete(args: { worktreePath: string; tagName: string }): Promise<IPCResult<void>>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
