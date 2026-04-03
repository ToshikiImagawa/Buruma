import type { FetchArgs, FetchResult } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class FetchUseCase implements FunctionUseCase<FetchArgs, Promise<FetchResult>> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: FetchArgs): Promise<FetchResult> {
    return this.repository.fetch(input)
  }
}
