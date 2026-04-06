import type { CommitResult } from '@domain'
import type { Observable } from 'rxjs'
import type {
  CommitRendererUseCase,
  GenerateCommitMessageRendererUseCase,
  GetOperationLoadingUseCase,
} from '../di-tokens'
import type { CommitViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class CommitDefaultViewModel implements CommitViewModel {
  readonly loading$: Observable<boolean>

  private readonly _generating$ = new BehaviorSubject<boolean>(false)
  readonly generating$: Observable<boolean> = this._generating$.asObservable()

  private readonly _lastCommitResult$ = new BehaviorSubject<CommitResult | null>(null)
  readonly lastCommitResult$: Observable<CommitResult | null> = this._lastCommitResult$.asObservable()

  constructor(
    private readonly commitUseCase: CommitRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
    private readonly generateCommitMessageUseCase: GenerateCommitMessageRendererUseCase,
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

  async generateCommitMessage(worktreePath: string): Promise<string> {
    this._generating$.next(true)
    try {
      return await this.generateCommitMessageUseCase.invoke({ worktreePath })
    } finally {
      this._generating$.next(false)
    }
  }
}
