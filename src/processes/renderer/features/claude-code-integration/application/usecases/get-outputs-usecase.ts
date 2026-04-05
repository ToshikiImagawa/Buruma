import type { ClaudeOutput } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../services/claude-service-interface'

export class GetOutputsUseCase implements ObservableStoreUseCase<ClaudeOutput[]> {
  readonly store: Observable<ClaudeOutput[]>

  constructor(service: ClaudeService) {
    this.store = service.outputs$
  }
}
