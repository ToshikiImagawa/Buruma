import type { BranchList } from '@domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from '../application/services/repository-viewer-service-interface'
import type { GetBranchesUseCase } from '../di-tokens'
import type { BranchListViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class BranchListDefaultViewModel implements BranchListViewModel {
  private readonly _branches$ = new BehaviorSubject<BranchList | null>(null)
  private readonly _loading$ = new BehaviorSubject<boolean>(false)
  private readonly _search$ = new BehaviorSubject<string>('')

  readonly branches$: Observable<BranchList | null> = this._branches$.asObservable()
  readonly loading$: Observable<boolean> = this._loading$.asObservable()
  readonly search$: Observable<string> = this._search$.asObservable()

  constructor(
    private readonly getBranchesUseCase: GetBranchesUseCase,
    private readonly service: RepositoryViewerService,
  ) {}

  loadBranches(worktreePath: string): void {
    this._loading$.next(true)
    this.getBranchesUseCase
      .invoke(worktreePath)
      .then((branches) => {
        this._branches$.next(branches)
      })
      .catch(() => {
        this._branches$.next(null)
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  setSearch(search: string): void {
    this._search$.next(search)
    this.service.setBranchSearch(search)
  }
}
