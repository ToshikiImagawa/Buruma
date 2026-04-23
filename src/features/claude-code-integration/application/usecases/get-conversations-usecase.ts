import type { ConversationSummary } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetConversationsUseCase implements ObservableStoreUseCase<ConversationSummary[]> {
  readonly store: Observable<ConversationSummary[]>

  constructor(service: ClaudeService) {
    this.store = service.conversations$
  }
}
