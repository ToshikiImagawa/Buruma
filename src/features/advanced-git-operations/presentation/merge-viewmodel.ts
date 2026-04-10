import type { MergeOptions, MergeResult, MergeStatus } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetAdvancedOperationLoadingUseCase,
  MergeAbortRendererUseCase,
  MergeRendererUseCase,
  MergeStatusRendererUseCase,
} from '../di-tokens'
import type { MergeViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class MergeDefaultViewModel implements MergeViewModel {
  readonly loading$: Observable<boolean>

  private readonly _mergeResult$ = new BehaviorSubject<MergeResult | null>(null)
  readonly mergeResult$: Observable<MergeResult | null> = this._mergeResult$.asObservable()

  private readonly _mergeStatus$ = new BehaviorSubject<MergeStatus | null>(null)
  readonly mergeStatus$: Observable<MergeStatus | null> = this._mergeStatus$.asObservable()

  constructor(
    private readonly mergeUseCase: MergeRendererUseCase,
    private readonly mergeAbortUseCase: MergeAbortRendererUseCase,
    private readonly mergeStatusUseCase: MergeStatusRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  merge(options: MergeOptions): void {
    this.mergeUseCase
      .invoke(options)
      .then((result) => {
        this._mergeResult$.next(result)
      })
      .catch(() => {
        this._mergeResult$.next(null)
      })
  }

  mergeAbort(worktreePath: string): void {
    this.mergeAbortUseCase.invoke(worktreePath)
  }

  getMergeStatus(worktreePath: string): void {
    this.mergeStatusUseCase
      .invoke(worktreePath)
      .then((status) => {
        this._mergeStatus$.next(status)
      })
      .catch(() => {
        this._mergeStatus$.next(null)
      })
  }
}
