import type { ChatMessage } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetChatMessagesUseCase implements ObservableStoreUseCase<ChatMessage[]> {
  readonly store: Observable<ChatMessage[]>

  constructor(service: ClaudeService) {
    this.store = service.chatMessages$
  }
}
