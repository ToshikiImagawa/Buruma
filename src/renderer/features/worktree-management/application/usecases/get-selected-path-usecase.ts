import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { IWorktreeService } from '../services/worktree-service-interface'

export class GetSelectedPathUseCaseImpl implements ObservableStoreUseCase<string | null> {
  constructor(private readonly service: IWorktreeService) {}

  get store(): Observable<string | null> {
    return this.service.selectedWorktreePath$
  }
}
