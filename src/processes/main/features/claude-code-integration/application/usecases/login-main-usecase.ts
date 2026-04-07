import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class LoginMainUseCase implements SupplierUseCase<Promise<void>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(): Promise<void> {
    return this.repository.login()
  }
}
