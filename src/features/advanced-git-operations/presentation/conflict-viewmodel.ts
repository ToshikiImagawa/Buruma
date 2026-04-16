import type { ConflictFile, ConflictResolveAllOptions, ConflictResolveOptions, ThreeWayContent } from '@domain'
import type { Observable } from 'rxjs'
import type {
  ConflictFileContentRendererUseCase,
  ConflictListRendererUseCase,
  ConflictMarkResolvedRendererUseCase,
  ConflictResolveAllRendererUseCase,
  ConflictResolveRendererUseCase,
  GetAdvancedOperationLoadingUseCase,
} from '../di-tokens'
import type { ConflictViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

export class ConflictDefaultViewModel implements ConflictViewModel {
  readonly loading$: Observable<boolean>

  private readonly _conflictFiles$ = new BehaviorSubject<ConflictFile[]>([])
  readonly conflictFiles$: Observable<ConflictFile[]> = this._conflictFiles$.asObservable()

  private readonly _threeWayContent$ = new BehaviorSubject<ThreeWayContent | null>(null)
  readonly threeWayContent$: Observable<ThreeWayContent | null> = this._threeWayContent$.asObservable()

  constructor(
    private readonly conflictListUseCase: ConflictListRendererUseCase,
    private readonly conflictFileContentUseCase: ConflictFileContentRendererUseCase,
    private readonly conflictResolveUseCase: ConflictResolveRendererUseCase,
    private readonly conflictResolveAllUseCase: ConflictResolveAllRendererUseCase,
    private readonly conflictMarkResolvedUseCase: ConflictMarkResolvedRendererUseCase,
    getOperationLoadingUseCase: GetAdvancedOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  conflictList(worktreePath: string): void {
    this.conflictListUseCase
      .invoke(worktreePath)
      .then((files) => {
        this._conflictFiles$.next(files)
      })
      .catch(() => {
        this._conflictFiles$.next([])
      })
  }

  conflictFileContent(worktreePath: string, filePath: string): void {
    this.conflictFileContentUseCase
      .invoke({ worktreePath, filePath })
      .then((content) => {
        this._threeWayContent$.next(content)
      })
      .catch(() => {
        this._threeWayContent$.next(null)
      })
  }

  getConflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent> {
    return this.conflictFileContentUseCase.invoke({ worktreePath, filePath })
  }

  conflictResolve(options: ConflictResolveOptions): void {
    this.conflictResolveUseCase.invoke(options)
  }

  conflictResolveAll(options: ConflictResolveAllOptions): void {
    this.conflictResolveAllUseCase.invoke(options)
  }

  conflictMarkResolved(worktreePath: string, filePath: string): void {
    this.conflictMarkResolvedUseCase.invoke({ worktreePath, filePath })
  }
}
