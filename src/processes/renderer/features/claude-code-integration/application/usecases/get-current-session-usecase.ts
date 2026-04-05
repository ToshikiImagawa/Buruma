import type { ClaudeSession } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetCurrentSessionUseCase implements ObservableStoreUseCase<ClaudeSession | null> {
  readonly store: Observable<ClaudeSession | null>

  constructor(service: ClaudeService) {
    this.store = service.currentSession$
  }
}
