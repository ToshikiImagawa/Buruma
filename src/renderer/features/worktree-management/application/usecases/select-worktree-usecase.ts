import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeService } from '../../di-tokens'

export class SelectWorktreeUseCaseImpl implements ConsumerUseCase<string | null> {
  constructor(private readonly service: IWorktreeService) {}

  invoke(path: string | null): void {
    this.service.setSelectedWorktree(path)
  }
}
