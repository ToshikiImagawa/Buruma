import type { CommitResult } from '@domain'
import type { Observable } from 'rxjs'
import type { CommitRendererUseCase, GetOperationLoadingUseCase } from '../di-tokens'
import type { CommitViewModel } from './viewmodel-interfaces'
import { formatDiffsAsText } from '@lib/format-diff'
import { BehaviorSubject } from 'rxjs'

export class CommitDefaultViewModel implements CommitViewModel {
  readonly loading$: Observable<boolean>

  private readonly _generating$ = new BehaviorSubject<boolean>(false)
  readonly generating$: Observable<boolean> = this._generating$.asObservable()

  private readonly _generateError$ = new BehaviorSubject<string | null>(null)
  readonly generateError$: Observable<string | null> = this._generateError$.asObservable()

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

  async generateCommitMessage(worktreePath: string): Promise<string> {
    this._generating$.next(true)
    this._generateError$.next(null)
    try {
      const diffResult = await window.electronAPI.git.diffStaged({ worktreePath })
      if (diffResult.success === false) {
        this._generateError$.next(diffResult.error.message)
        return ''
      }
      const diffText = formatDiffsAsText(diffResult.data)
      const result = await window.electronAPI.claude.generateCommitMessage({ worktreePath, diffText })
      if (result.success === false) {
        this._generateError$.next(result.error.message)
        return ''
      }
      return result.data
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this._generateError$.next(message)
      return ''
    } finally {
      this._generating$.next(false)
    }
  }
}
