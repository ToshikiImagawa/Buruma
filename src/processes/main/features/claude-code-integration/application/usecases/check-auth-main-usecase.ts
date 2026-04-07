import type { ClaudeAuthStatus } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class CheckAuthMainUseCase implements SupplierUseCase<Promise<ClaudeAuthStatus>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(): Promise<ClaudeAuthStatus> {
    return this.repository.checkAuth()
  }
}
