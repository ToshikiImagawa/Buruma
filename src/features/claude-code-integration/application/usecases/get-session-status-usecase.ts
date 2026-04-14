import type { SessionStatus } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetSessionStatusUseCase implements ObservableStoreUseCase<SessionStatus> {
  readonly store: Observable<SessionStatus>

  constructor(service: ClaudeService) {
    this.store = service.status$
  }
}
