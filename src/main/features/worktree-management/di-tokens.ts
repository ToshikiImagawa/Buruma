import { createToken } from '@shared/lib/di'
import type { IWorktreeGitService, IWorktreeWatcher } from './application/worktree-interfaces'
import type { WorktreeMainUseCase } from './application/worktree-main-usecase'

export const WorktreeGitServiceToken = createToken<IWorktreeGitService>('WorktreeGitService')
export const WorktreeWatcherToken = createToken<IWorktreeWatcher>('WorktreeWatcher')
export const WorktreeMainUseCaseToken = createToken<WorktreeMainUseCase>('WorktreeMainUseCase')
