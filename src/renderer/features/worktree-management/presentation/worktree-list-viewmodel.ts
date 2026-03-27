import type { Observable } from 'rxjs'
import type { WorktreeInfo, WorktreeCreateParams, WorktreeDeleteParams, WorktreeSortOrder } from '@shared/domain'
import type {
  IWorktreeListViewModel,
  ListWorktreesUseCase,
  SelectWorktreeUseCase,
  CreateWorktreeUseCase,
  DeleteWorktreeUseCase,
  RefreshWorktreesUseCase,
  IWorktreeService,
} from '../di-tokens'

export class WorktreeListViewModel implements IWorktreeListViewModel {
  constructor(
    private readonly listUseCase: ListWorktreesUseCase,
    private readonly selectUseCase: SelectWorktreeUseCase,
    private readonly createUseCase: CreateWorktreeUseCase,
    private readonly deleteUseCase: DeleteWorktreeUseCase,
    private readonly refreshUseCase: RefreshWorktreesUseCase,
    private readonly service: IWorktreeService,
  ) {}

  get worktrees$(): Observable<WorktreeInfo[]> {
    return this.listUseCase.store
  }

  get selectedPath$(): Observable<string | null> {
    return this.service.selectedWorktreePath$
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
    this.service.setSortOrder(order)
  }
}
