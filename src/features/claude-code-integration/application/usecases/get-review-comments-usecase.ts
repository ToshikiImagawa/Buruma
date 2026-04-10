import type { ReviewComment } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetReviewCommentsUseCase implements ObservableStoreUseCase<ReviewComment[]> {
  readonly store: Observable<ReviewComment[]>

  constructor(service: ClaudeService) {
    this.store = service.reviewComments$
  }
}
