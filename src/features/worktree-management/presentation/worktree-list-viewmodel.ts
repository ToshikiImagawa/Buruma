import type {
  BranchList,
  RecoveryRequest,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeSortOrder,
} from '@domain'
import type { Observable } from 'rxjs'
import type {
  CreateWorktreeUseCase,
  DeleteWorktreeUseCase,
  GetBranchesUseCase,
  GetSelectedPathUseCase,
  ListWorktreesUseCase,
  RefreshWorktreesUseCase,
  SelectWorktreeUseCase,
  SetSortOrderUseCase,
  SuggestPathUseCase,
  WorktreeService,
} from '../di-tokens'
import type { WorktreeListViewModel } from './viewmodel-interfaces'

export class WorktreeListDefaultViewModel implements WorktreeListViewModel {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedPath$: Observable<string | null>
  readonly recoveryRequest$: Observable<RecoveryRequest | null>

  constructor(
    private readonly listUseCase: ListWorktreesUseCase,
    private readonly selectUseCase: SelectWorktreeUseCase,
    private readonly createUseCase: CreateWorktreeUseCase,
    private readonly deleteUseCase: DeleteWorktreeUseCase,
    private readonly refreshUseCase: RefreshWorktreesUseCase,
    private readonly getSelectedPathUseCase: GetSelectedPathUseCase,
    private readonly setSortOrderUseCase: SetSortOrderUseCase,
    private readonly getBranchesUseCase: GetBranchesUseCase,
    private readonly suggestPathUseCase: SuggestPathUseCase,
    private readonly worktreeService: WorktreeService,
  ) {
    this.worktrees$ = this.listUseCase.store
    this.selectedPath$ = this.getSelectedPathUseCase.store
    this.recoveryRequest$ = this.worktreeService.recoveryRequest$
  }

  selectWorktree(path: string | null): void {
    this.selectUseCase.invoke(path)
  }

  createWorktree(params: WorktreeCreateParams): void {
    this.createUseCase.invoke(params)
  }

  deleteWorktree(params: WorktreeDeleteParams): void {
    this.deleteUseCase.invoke(params)
  }

  refreshWorktrees(): void {
    this.refreshUseCase.invoke()
  }

  setSortOrder(order: WorktreeSortOrder): void {
    this.setSortOrderUseCase.invoke(order)
  }

  getBranches(worktreePath: string): Promise<BranchList> {
    return this.getBranchesUseCase.invoke(worktreePath)
  }

  suggestPath(repoPath: string, branch: string): Promise<string> {
    return this.suggestPathUseCase.invoke({ repoPath, branch })
  }

  confirmRecovery(): void {
    const request = this.worktreeService.currentRecoveryRequest
    this.worktreeService.clearRecovery()
    if (request) {
      this.deleteUseCase.invoke(request.params as WorktreeDeleteParams)
    }
  }

  dismissRecovery(): void {
    this.worktreeService.clearRecovery()
  }
}
