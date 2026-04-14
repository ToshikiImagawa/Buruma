import type { DiffTarget } from '@domain'
import type { Observable } from 'rxjs'
import type {
  ExplainDiffRendererUseCase,
  GetExplanationRendererUseCase,
  GetIsExplainingRendererUseCase,
} from '../di-tokens'
import type { ClaudeExplainViewModel } from './viewmodel-interfaces'

export class ClaudeExplainDefaultViewModel implements ClaudeExplainViewModel {
  readonly explanation$: Observable<string>
  readonly isExplaining$: Observable<boolean>

  constructor(
    private readonly explainDiffUseCase: ExplainDiffRendererUseCase,
    getExplanationUseCase: GetExplanationRendererUseCase,
    getIsExplainingUseCase: GetIsExplainingRendererUseCase,
  ) {
    this.explanation$ = getExplanationUseCase.store
    this.isExplaining$ = getIsExplainingUseCase.store
  }

  requestExplain(worktreePath: string, diffTarget: DiffTarget, diffText: string): void {
    this.explainDiffUseCase.invoke({ worktreePath, diffTarget, diffText })
  }
}
