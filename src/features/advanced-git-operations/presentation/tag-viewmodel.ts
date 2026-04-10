import type { TagCreateOptions, TagInfo } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetAdvancedOperationLoadingUseCase,
  TagCreateRendererUseCase,
  TagDeleteRendererUseCase,
  TagListRendererUseCase,
} from '../di-tokens'
import type { TagViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class TagDefaultViewModel implements TagViewModel {
  readonly loading$: Observable<boolean>

  private readonly _tags$ = new BehaviorSubject<TagInfo[]>([])
  readonly tags$: Observable<TagInfo[]> = this._tags$.asObservable()

  constructor(
    private readonly tagListUseCase: TagListRendererUseCase,
    private readonly tagCreateUseCase: TagCreateRendererUseCase,
    private readonly tagDeleteUseCase: TagDeleteRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  tagList(worktreePath: string): void {
    this.tagListUseCase
      .invoke(worktreePath)
      .then((tags) => {
        this._tags$.next(tags)
      })
      .catch(() => {
        this._tags$.next([])
      })
  }

  tagCreate(options: TagCreateOptions): void {
    this.tagCreateUseCase.invoke(options)
  }

  tagDelete(worktreePath: string, tagName: string): void {
    this.tagDeleteUseCase.invoke({ worktreePath, tagName })
  }
}
