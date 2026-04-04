import type {
  CherryPickOptions,
  ConflictResolveAllOptions,
  ConflictResolveOptions,
  InteractiveRebaseOptions,
  MergeOptions,
  RebaseOptions,
  StashSaveOptions,
  TagCreateOptions,
} from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  CherryPickAbortMainUseCase,
  CherryPickMainUseCase,
  ConflictFileContentMainUseCase,
  ConflictListMainUseCase,
  ConflictMarkResolvedMainUseCase,
  ConflictResolveAllMainUseCase,
  ConflictResolveMainUseCase,
  GetRebaseCommitsMainUseCase,
  MergeAbortMainUseCase,
  MergeMainUseCase,
  MergeStatusMainUseCase,
  RebaseAbortMainUseCase,
  RebaseContinueMainUseCase,
  RebaseInteractiveMainUseCase,
  RebaseMainUseCase,
  StashApplyMainUseCase,
  StashClearMainUseCase,
  StashDropMainUseCase,
  StashListMainUseCase,
  StashPopMainUseCase,
  StashSaveMainUseCase,
  TagCreateMainUseCase,
  TagDeleteMainUseCase,
  TagListMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
import { ipcMain } from 'electron'
import { GitAdvancedOperationError } from '../infrastructure/repositories/git-advanced-default-repository'

function validatePath(value: string | undefined, name: string): void {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} は必須です`)
  }
  if (value.includes('..')) {
    throw new Error(`${name} にパストラバーサルは許可されていません`)
  }
}

function wrapHandler<T>(handler: () => T | Promise<T>): Promise<IPCResult<Awaited<T>>> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => ipcSuccess(data as Awaited<T>))
    .catch((error: unknown) => {
      if (error instanceof GitAdvancedOperationError) {
        return ipcFailure<Awaited<T>>(error.code, error.message)
      }
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

const CHANNELS = [
  'git:merge',
  'git:merge-abort',
  'git:merge-status',
  'git:conflict-list',
  'git:conflict-file-content',
  'git:conflict-resolve',
  'git:conflict-resolve-all',
  'git:conflict-mark-resolved',
  'git:rebase',
  'git:rebase-interactive',
  'git:rebase-abort',
  'git:rebase-continue',
  'git:rebase-get-commits',
  'git:stash-save',
  'git:stash-list',
  'git:stash-pop',
  'git:stash-apply',
  'git:stash-drop',
  'git:stash-clear',
  'git:cherry-pick',
  'git:cherry-pick-abort',
  'git:tag-list',
  'git:tag-create',
  'git:tag-delete',
] as const

export function registerGitAdvancedIPCHandlers(
  mergeUseCase: MergeMainUseCase,
  mergeAbortUseCase: MergeAbortMainUseCase,
  mergeStatusUseCase: MergeStatusMainUseCase,
  conflictListUseCase: ConflictListMainUseCase,
  conflictFileContentUseCase: ConflictFileContentMainUseCase,
  conflictResolveUseCase: ConflictResolveMainUseCase,
  conflictResolveAllUseCase: ConflictResolveAllMainUseCase,
  conflictMarkResolvedUseCase: ConflictMarkResolvedMainUseCase,
  rebaseUseCase: RebaseMainUseCase,
  rebaseInteractiveUseCase: RebaseInteractiveMainUseCase,
  rebaseAbortUseCase: RebaseAbortMainUseCase,
  rebaseContinueUseCase: RebaseContinueMainUseCase,
  getRebaseCommitsUseCase: GetRebaseCommitsMainUseCase,
  stashSaveUseCase: StashSaveMainUseCase,
  stashListUseCase: StashListMainUseCase,
  stashPopUseCase: StashPopMainUseCase,
  stashApplyUseCase: StashApplyMainUseCase,
  stashDropUseCase: StashDropMainUseCase,
  stashClearUseCase: StashClearMainUseCase,
  cherryPickUseCase: CherryPickMainUseCase,
  cherryPickAbortUseCase: CherryPickAbortMainUseCase,
  tagListUseCase: TagListMainUseCase,
  tagCreateUseCase: TagCreateMainUseCase,
  tagDeleteUseCase: TagDeleteMainUseCase,
): () => void {
  // --- マージ ---
  ipcMain.handle('git:merge', (_event, args: MergeOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:merge-abort', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeAbortUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:merge-status', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeStatusUseCase.invoke(args.worktreePath)
    }),
  )

  // --- コンフリクト解決 ---
  ipcMain.handle('git:conflict-list', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictListUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:conflict-file-content', (_event, args: { worktreePath: string; filePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictFileContentUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:conflict-resolve', (_event, args: ConflictResolveOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictResolveUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:conflict-resolve-all', (_event, args: ConflictResolveAllOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictResolveAllUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:conflict-mark-resolved', (_event, args: { worktreePath: string; filePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictMarkResolvedUseCase.invoke(args)
    }),
  )

  // --- リベース ---
  ipcMain.handle('git:rebase', (_event, args: RebaseOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return rebaseUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:rebase-interactive', (_event, args: InteractiveRebaseOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return rebaseInteractiveUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:rebase-abort', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return rebaseAbortUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:rebase-continue', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return rebaseContinueUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:rebase-get-commits', (_event, args: { worktreePath: string; onto: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getRebaseCommitsUseCase.invoke(args)
    }),
  )

  // --- スタッシュ ---
  ipcMain.handle('git:stash-save', (_event, args: StashSaveOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashSaveUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:stash-list', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashListUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:stash-pop', (_event, args: { worktreePath: string; index: number }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashPopUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:stash-apply', (_event, args: { worktreePath: string; index: number }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashApplyUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:stash-drop', (_event, args: { worktreePath: string; index: number }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashDropUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:stash-clear', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashClearUseCase.invoke(args.worktreePath)
    }),
  )

  // --- チェリーピック ---
  ipcMain.handle('git:cherry-pick', (_event, args: CherryPickOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return cherryPickUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:cherry-pick-abort', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return cherryPickAbortUseCase.invoke(args.worktreePath)
    }),
  )

  // --- タグ ---
  ipcMain.handle('git:tag-list', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return tagListUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:tag-create', (_event, args: TagCreateOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return tagCreateUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:tag-delete', (_event, args: { worktreePath: string; tagName: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return tagDeleteUseCase.invoke(args)
    }),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
