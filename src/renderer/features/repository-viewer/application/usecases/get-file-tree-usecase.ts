import type { FileTreeNode } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetFileTreeUseCase implements FunctionUseCase<string, Promise<FileTreeNode>> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: string): Promise<FileTreeNode> {
    return this.repository.getFileTree(input)
  }
}
