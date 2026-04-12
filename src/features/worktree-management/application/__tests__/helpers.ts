import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeInfo } from '@domain'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'
import { vi } from 'vitest'

export function createMockRepo(overrides: Partial<WorktreeRepository> = {}): WorktreeRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    getStatus: vi.fn(),
    create: vi.fn().mockResolvedValue({} as WorktreeInfo),
    delete: vi.fn().mockResolvedValue(undefined),
    suggestPath: vi.fn(),
    checkDirty: vi.fn(),
    getBranches: vi.fn(),
    onChanged: vi.fn(),
    ...overrides,
  } as WorktreeRepository
}

export function createMockService(): WorktreeService {
  return {
    worktrees$: null!,
    selectedWorktreePath$: null!,
    sortOrder$: null!,
    recoveryRequest$: null!,
    updateWorktrees: vi.fn(),
    setSelectedWorktree: vi.fn(),
    setSortOrder: vi.fn(),
    requestRecovery: vi.fn(),
    clearRecovery: vi.fn(),
    setUp: vi.fn(),
    tearDown: vi.fn(),
  }
}

export function createMockErrorService(): ErrorNotificationService {
  return {
    notifications$: null!,
    addNotification: vi.fn(),
    notifyError: vi.fn(),
    removeNotification: vi.fn(),
    clear: vi.fn(),
    setUp: vi.fn(),
    tearDown: vi.fn(),
  }
}
