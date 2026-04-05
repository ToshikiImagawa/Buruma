import type { ClaudeOutput, ClaudeSession, SessionStatus } from '@domain'
import type { BaseService } from '@lib/service'
import type { ChildProcess } from 'child_process'

export interface InternalSession {
  worktreePath: string
  status: SessionStatus
  pid: number | null
  startedAt: string | null
  error: string | null
  outputBuffer: ClaudeOutput[]
  process: ChildProcess | null
}

export interface ClaudeSessionStore extends BaseService {
  set(worktreePath: string, session: InternalSession): void
  get(worktreePath: string): InternalSession | null
  delete(worktreePath: string): void
  has(worktreePath: string): boolean
  getAll(): ClaudeSession[]
  getOutputHistory(worktreePath: string): ClaudeOutput[]
  appendOutput(worktreePath: string, output: ClaudeOutput): void
  toClaudeSession(internal: InternalSession): ClaudeSession
}
