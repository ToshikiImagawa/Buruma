import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class LogoutMainUseCase implements SupplierUseCase<Promise<void>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(): Promise<void> {
    return this.repository.logout()
  }
}
