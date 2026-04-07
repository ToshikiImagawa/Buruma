import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class LogoutUseCase implements SupplierUseCase<Promise<void>> {
  constructor(private readonly repository: ClaudeRepository) {}

  invoke(): Promise<void> {
    return this.repository.logout()
  }
}
