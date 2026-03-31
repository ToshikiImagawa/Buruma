import type { WorktreeInfo } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { GetSelectedWorktreeUseCase } from '../di-tokens'
import type { IWorktreeDetailViewModel } from './viewmodel-interfaces'

export class WorktreeDetailViewModel implements IWorktreeDetailViewModel {
  constructor(private readonly getSelectedUseCase: GetSelectedWorktreeUseCase) {}

  get selectedWorktree$(): Observable<WorktreeInfo | null> {
    return this.getSelectedUseCase.store
  }
}
