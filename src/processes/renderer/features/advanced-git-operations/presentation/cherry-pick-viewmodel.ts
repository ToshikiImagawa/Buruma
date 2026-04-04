import type { CherryPickOptions, CherryPickResult } from '@domain'
import type { Observable } from 'rxjs'
import type {
  CherryPickAbortRendererUseCase,
  CherryPickRendererUseCase,
  GetAdvancedOperationLoadingUseCase,
} from '../di-tokens'
import type { CherryPickViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class CherryPickDefaultViewModel implements CherryPickViewModel {
  readonly loading$: Observable<boolean>

  private readonly _cherryPickResult$ = new BehaviorSubject<CherryPickResult | null>(null)
  readonly cherryPickResult$: Observable<CherryPickResult | null> =
    this._cherryPickResult$.asObservable()

  constructor(
    private readonly cherryPickUseCase: CherryPickRendererUseCase,
    private readonly cherryPickAbortUseCase: CherryPickAbortRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  cherryPick(options: CherryPickOptions): void {
    this.cherryPickUseCase
      .invoke(options)
      .then((result) => {
        this._cherryPickResult$.next(result)
      })
      .catch(() => {
        this._cherryPickResult$.next(null)
      })
  }

  cherryPickAbort(worktreePath: string): void {
    this.cherryPickAbortUseCase.invoke(worktreePath)
  }
}
