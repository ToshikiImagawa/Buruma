import type { DiffTarget, ReviewComment } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetIsReviewingRendererUseCase,
  GetReviewCommentsRendererUseCase,
  GetReviewSummaryRendererUseCase,
  ReviewDiffRendererUseCase,
} from '../di-tokens'
import type { ClaudeReviewViewModel } from './viewmodel-interfaces'

export class ClaudeReviewDefaultViewModel implements ClaudeReviewViewModel {
  readonly reviewComments$: Observable<ReviewComment[]>
  readonly reviewSummary$: Observable<string>
  readonly isReviewing$: Observable<boolean>

  constructor(
    private readonly reviewDiffUseCase: ReviewDiffRendererUseCase,
    getReviewCommentsUseCase: GetReviewCommentsRendererUseCase,
    getReviewSummaryUseCase: GetReviewSummaryRendererUseCase,
    getIsReviewingUseCase: GetIsReviewingRendererUseCase,
  ) {
    this.reviewComments$ = getReviewCommentsUseCase.store
    this.reviewSummary$ = getReviewSummaryUseCase.store
    this.isReviewing$ = getIsReviewingUseCase.store
  }

  requestReview(worktreePath: string, diffTarget: DiffTarget, diffText: string): void {
    this.reviewDiffUseCase.invoke({ worktreePath, diffTarget, diffText })
  }
}
