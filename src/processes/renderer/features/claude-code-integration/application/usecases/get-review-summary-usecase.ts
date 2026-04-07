import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetReviewSummaryUseCase implements ObservableStoreUseCase<string> {
  readonly store: Observable<string>

  constructor(service: ClaudeService) {
    this.store = service.reviewSummary$
  }
}
