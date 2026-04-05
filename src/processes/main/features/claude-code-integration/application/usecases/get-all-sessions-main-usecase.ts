import type { ClaudeSession } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class GetAllSessionsMainUseCase implements SupplierUseCase<ClaudeSession[]> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(): ClaudeSession[] {
    return this.repository.getAllSessions()
  }
}
