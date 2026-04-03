import type { FileTreeNode } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetFileTreeMainUseCase implements FunctionUseCase<{ worktreePath: string }, Promise<FileTreeNode>> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string }): Promise<FileTreeNode> {
    return this.gitRepository.getFileTree(input.worktreePath)
  }
}
