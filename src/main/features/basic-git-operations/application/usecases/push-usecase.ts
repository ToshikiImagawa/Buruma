import type { PushArgs, PushResult } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class PushUseCase implements FunctionUseCase<PushArgs, Promise<PushResult>> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: PushArgs): Promise<PushResult> {
    return this.repository.push(input)
  }
}
