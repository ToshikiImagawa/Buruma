import type { StashEntry, StashSaveOptions } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetAdvancedOperationLoadingUseCase,
  StashApplyRendererUseCase,
  StashClearRendererUseCase,
  StashDropRendererUseCase,
  StashListRendererUseCase,
  StashPopRendererUseCase,
  StashSaveRendererUseCase,
} from '../di-tokens'
import type { StashViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class StashDefaultViewModel implements StashViewModel {
  readonly loading$: Observable<boolean>

  private readonly _stashes$ = new BehaviorSubject<StashEntry[]>([])
  readonly stashes$: Observable<StashEntry[]> = this._stashes$.asObservable()

  constructor(
    private readonly stashSaveUseCase: StashSaveRendererUseCase,
    private readonly stashListUseCase: StashListRendererUseCase,
    private readonly stashPopUseCase: StashPopRendererUseCase,
    private readonly stashApplyUseCase: StashApplyRendererUseCase,
    private readonly stashDropUseCase: StashDropRendererUseCase,
    private readonly stashClearUseCase: StashClearRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  stashSave(options: StashSaveOptions): void {
    this.stashSaveUseCase.invoke(options)
  }

  stashList(worktreePath: string): void {
    this.stashListUseCase
      .invoke(worktreePath)
      .then((stashes) => {
        this._stashes$.next(stashes)
      })
      .catch(() => {
        this._stashes$.next([])
      })
  }

  stashPop(worktreePath: string, index: number): void {
    this.stashPopUseCase.invoke({ worktreePath, index })
  }

  stashApply(worktreePath: string, index: number): void {
    this.stashApplyUseCase.invoke({ worktreePath, index })
  }

  stashDrop(worktreePath: string, index: number): void {
    this.stashDropUseCase.invoke({ worktreePath, index })
  }

  stashClear(worktreePath: string): void {
    this.stashClearUseCase.invoke(worktreePath)
  }
}
