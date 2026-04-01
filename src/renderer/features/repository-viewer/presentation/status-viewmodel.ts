import type { GitStatus } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from '../application/services/repository-viewer-service-interface'
import type { GetStatusUseCase } from '../di-tokens'
import type { StatusViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class StatusDefaultViewModel implements StatusViewModel {
  private readonly _status$ = new BehaviorSubject<GitStatus | null>(null)
  private readonly _loading$ = new BehaviorSubject<boolean>(false)

  readonly status$: Observable<GitStatus | null> = this._status$.asObservable()
  readonly loading$: Observable<boolean> = this._loading$.asObservable()

  constructor(
    private readonly getStatusUseCase: GetStatusUseCase,
    private readonly service: RepositoryViewerService,
  ) {}

  loadStatus(worktreePath: string): void {
    this._loading$.next(true)
    this.getStatusUseCase
      .invoke(worktreePath)
      .then((status) => {
        this._status$.next(status)
      })
      .catch(() => {
        this._status$.next(null)
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  selectFile(filePath: string, staged: boolean): void {
    this.service.selectFile(filePath, staged)
  }
}
