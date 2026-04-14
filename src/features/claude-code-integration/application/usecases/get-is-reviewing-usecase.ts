import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetIsReviewingUseCase implements ObservableStoreUseCase<boolean> {
  readonly store: Observable<boolean>

  constructor(service: ClaudeService) {
    this.store = service.isReviewing$
  }
}
