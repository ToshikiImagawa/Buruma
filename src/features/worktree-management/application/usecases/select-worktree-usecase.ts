import type { ConsumerUseCase } from '@lib/usecase/types'
import type { WorktreeService } from '../services/worktree-service-interface'

export class SelectWorktreeDefaultUseCase implements ConsumerUseCase<string | null> {
  constructor(private readonly service: WorktreeService) {}

  invoke(path: string | null): void {
    this.service.setSelectedWorktree(path)
  }
}
