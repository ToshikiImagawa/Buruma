import type { Observable } from 'rxjs'
import type {
  GetOperationLoadingUseCase,
  StageAllRendererUseCase,
  StageFilesRendererUseCase,
  UnstageAllRendererUseCase,
  UnstageFilesRendererUseCase,
} from '../di-tokens'
import type { StagingViewModel } from './viewmodel-interfaces'

export class StagingDefaultViewModel implements StagingViewModel {
  readonly loading$: Observable<boolean>

  constructor(
    private readonly stageFilesUseCase: StageFilesRendererUseCase,
    private readonly unstageFilesUseCase: UnstageFilesRendererUseCase,
    private readonly stageAllUseCase: StageAllRendererUseCase,
    private readonly unstageAllUseCase: UnstageAllRendererUseCase,
    getOperationLoadingUseCase: GetOperationLoadingUseCase,
  ) {
    this.loading$ = getOperationLoadingUseCase.store
  }

  stageFiles(worktreePath: string, files: string[]): void {
    this.stageFilesUseCase.invoke({ worktreePath, files })
  }

  unstageFiles(worktreePath: string, files: string[]): void {
    this.unstageFilesUseCase.invoke({ worktreePath, files })
  }

  stageAll(worktreePath: string): void {
    this.stageAllUseCase.invoke({ worktreePath })
  }

  unstageAll(worktreePath: string): void {
    this.unstageAllUseCase.invoke({ worktreePath })
  }
}
