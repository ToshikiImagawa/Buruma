import type { WorktreeInfo } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { GetSelectedWorktreeUseCase, IWorktreeDetailViewModel } from '../di-tokens'

export class WorktreeDetailViewModel implements IWorktreeDetailViewModel {
  constructor(private readonly getSelectedUseCase: GetSelectedWorktreeUseCase) {}

  get selectedWorktree$(): Observable<WorktreeInfo | null> {
    return this.getSelectedUseCase.store
  }
}
