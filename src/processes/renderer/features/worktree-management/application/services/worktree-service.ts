import type { WorktreeInfo, WorktreeSortOrder } from '@domain'
import type { Observable } from 'rxjs'
import type { WorktreeService } from './worktree-service-interface'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

export class WorktreeDefaultService implements WorktreeService {
  private readonly _worktrees$ = new BehaviorSubject<WorktreeInfo[]>([])
  private readonly _selectedWorktreePath$ = new BehaviorSubject<string | null>(null)
  private readonly _sortOrder$ = new BehaviorSubject<WorktreeSortOrder>('name')

  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedWorktreePath$: Observable<string | null>
  readonly sortOrder$: Observable<WorktreeSortOrder>

  constructor() {
    this.worktrees$ = combineLatest([this._worktrees$, this._sortOrder$]).pipe(
      map(([worktrees, order]) => this.sortWorktrees(worktrees, order)),
    )
    this.selectedWorktreePath$ = this._selectedWorktreePath$.asObservable()
    this.sortOrder$ = this._sortOrder$.asObservable()
  }

  setUp(initialWorktrees: WorktreeInfo[]): void {
    this._worktrees$.next(initialWorktrees)
  }

  tearDown(): void {
    this._worktrees$.complete()
    this._selectedWorktreePath$.complete()
    this._sortOrder$.complete()
  }

  updateWorktrees(worktrees: WorktreeInfo[]): void {
    this._worktrees$.next(worktrees)
  }

  setSelectedWorktree(path: string | null): void {
    this._selectedWorktreePath$.next(path)
  }

  setSortOrder(order: WorktreeSortOrder): void {
    this._sortOrder$.next(order)
  }

  private sortWorktrees(worktrees: WorktreeInfo[], order: WorktreeSortOrder): WorktreeInfo[] {
    const sorted = [...worktrees]
    if (order === 'name') {
      sorted.sort((a, b) => {
        const nameA = a.path.split('/').pop() ?? ''
        const nameB = b.path.split('/').pop() ?? ''
        return nameA.localeCompare(nameB)
      })
    }
    // 'last-updated' は headMessage/head ベースでのソートが必要だが、
    // WorktreeInfo に author date がないため、現時点では name ソートのみ実装
    // 将来的に WorktreeInfo に lastUpdated フィールドを追加して対応
    return sorted
  }
}
