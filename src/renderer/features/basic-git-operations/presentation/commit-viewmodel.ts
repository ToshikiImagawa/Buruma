import type { CommitResult } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { CommitRendererUseCase, GetOperationLoadingUseCase } from '../di-tokens'
import type { CommitViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class CommitDefaultViewModel implements CommitViewModel {
  readonly loading$: Observable<boolean>

  private readonly _lastCommitResult$ = new BehaviorSubject<CommitResult | null>(null)
  readonly lastCommitResult$: Observable<CommitResult | null> = this._lastCommitResult$.asObservable()

  constructor(
    private readonly commitUseCase: CommitRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  commit(worktreePath: string, message: string, amend?: boolean): void {
    this.commitUseCase
      .invoke({ worktreePath, message, amend })
      .then((result) => {
        this._lastCommitResult$.next(result)
      })
      .catch(() => {
        this._lastCommitResult$.next(null)
      })
  }
}
