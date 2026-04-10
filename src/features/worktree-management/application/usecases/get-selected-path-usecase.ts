import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { WorktreeService } from '../services/worktree-service-interface'

export class GetSelectedPathDefaultUseCase implements ObservableStoreUseCase<string | null> {
  constructor(private readonly service: WorktreeService) {}

  get store(): Observable<string | null> {
    return this.service.selectedWorktreePath$
  }
}
