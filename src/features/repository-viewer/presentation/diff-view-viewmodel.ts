import type { DiffDisplayMode, FileDiff } from '@domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from '../application/services/repository-viewer-service-interface'
import type { GetDiffCommitUseCase, GetDiffStagedUseCase, GetDiffUseCase } from '../di-tokens'
import type { DiffViewViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class DiffViewDefaultViewModel implements DiffViewViewModel {
  private readonly _diffs$ = new BehaviorSubject<FileDiff[]>([])
  private readonly _displayMode$ = new BehaviorSubject<DiffDisplayMode>('inline')
  private readonly _loading$ = new BehaviorSubject<boolean>(false)

  readonly diffs$: Observable<FileDiff[]> = this._diffs$.asObservable()
  readonly displayMode$: Observable<DiffDisplayMode> = this._displayMode$.asObservable()
  readonly loading$: Observable<boolean> = this._loading$.asObservable()

  constructor(
    private readonly getDiffUseCase: GetDiffUseCase,
    private readonly getDiffStagedUseCase: GetDiffStagedUseCase,
    private readonly getDiffCommitUseCase: GetDiffCommitUseCase,
    private readonly service: RepositoryViewerService,
  ) {}

  loadDiff(worktreePath: string, filePath: string, staged: boolean): void {
    this._loading$.next(true)
    const useCase = staged ? this.getDiffStagedUseCase : this.getDiffUseCase
    useCase
      .invoke({ worktreePath, filePath })
      .then((diffs) => {
        this._diffs$.next(diffs)
        this.service.setDiffs(diffs)
      })
      .catch(() => {
        this._diffs$.next([])
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  loadCommitDiff(worktreePath: string, hash: string, filePath?: string): void {
    this._loading$.next(true)
    this.getDiffCommitUseCase
      .invoke({ worktreePath, hash, filePath })
      .then((diffs) => {
        this._diffs$.next(diffs)
        this.service.setDiffs(diffs)
      })
      .catch(() => {
        this._diffs$.next([])
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  setDisplayMode(mode: DiffDisplayMode): void {
    this._displayMode$.next(mode)
    this.service.setDiffDisplayMode(mode)
  }
}
