import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetCurrentConversationIdUseCase implements ObservableStoreUseCase<string | null> {
  readonly store: Observable<string | null>

  constructor(service: ClaudeService) {
    this.store = service.currentConversationId$
  }
}
