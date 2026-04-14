import type { ClaudeAuthStatus } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class CheckAuthUseCase implements SupplierUseCase<Promise<ClaudeAuthStatus>> {
  constructor(private readonly repository: ClaudeRepository) {}

  invoke(): Promise<ClaudeAuthStatus> {
    return this.repository.checkAuth()
  }
}
