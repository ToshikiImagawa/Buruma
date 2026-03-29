import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeSortOrder } from '@shared/domain'
import type { Observable } from 'rxjs'
import type {
  CreateWorktreeUseCase,
  DeleteWorktreeUseCase,
  GetSelectedPathUseCase,
  IWorktreeListViewModel,
  ListWorktreesUseCase,
  RefreshWorktreesUseCase,
  SelectWorktreeUseCase,
  SetSortOrderUseCase,
} from '../di-tokens'

export class WorktreeListViewModel implements IWorktreeListViewModel {
  constructor(
    private readonly listUseCase: ListWorktreesUseCase,
    private readonly selectUseCase: SelectWorktreeUseCase,
    private readonly createUseCase: CreateWorktreeUseCase,
    private readonly deleteUseCase: DeleteWorktreeUseCase,
    private readonly refreshUseCase: RefreshWorktreesUseCase,
    private readonly getSelectedPathUseCase: GetSelectedPathUseCase,
    private readonly setSortOrderUseCase: SetSortOrderUseCase,
  ) {}

  get worktrees$(): Observable<WorktreeInfo[]> {
    return this.listUseCase.store
  }

  get selectedPath$(): Observable<string | null> {
    return this.getSelectedPathUseCase.store
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
}
