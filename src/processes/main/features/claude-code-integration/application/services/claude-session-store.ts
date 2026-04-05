import type { ClaudeOutput, ClaudeSession } from '@domain'
import type { ClaudeSessionStore, InternalSession } from './claude-session-store-interface'

const MAX_OUTPUT_BUFFER = 1000

export class ClaudeDefaultSessionStore implements ClaudeSessionStore {
  private sessions = new Map<string, InternalSession>()

  setUp(): void {
    this.sessions.clear()
  }

  tearDown(): void {
    this.sessions.clear()
  }

  set(worktreePath: string, session: InternalSession): void {
    this.sessions.set(worktreePath, session)
  }

  get(worktreePath: string): InternalSession | null {
    return this.sessions.get(worktreePath) ?? null
  }

  delete(worktreePath: string): void {
    this.sessions.delete(worktreePath)
  }

  has(worktreePath: string): boolean {
    return this.sessions.has(worktreePath)
  }

  getAll(): ClaudeSession[] {
    return Array.from(this.sessions.values()).map((s) => this.toClaudeSession(s))
  }

  getOutputHistory(worktreePath: string): ClaudeOutput[] {
    const session = this.sessions.get(worktreePath)
    return session?.outputBuffer ?? []
  }

  appendOutput(worktreePath: string, output: ClaudeOutput): void {
    const session = this.sessions.get(worktreePath)
    if (!session) return
    session.outputBuffer.push(output)
    if (session.outputBuffer.length > MAX_OUTPUT_BUFFER) {
      session.outputBuffer = session.outputBuffer.slice(-MAX_OUTPUT_BUFFER)
    }
  }

  toClaudeSession(internal: InternalSession): ClaudeSession {
    return {
      worktreePath: internal.worktreePath,
      status: internal.status,
      pid: internal.pid,
      startedAt: internal.startedAt,
      error: internal.error,
    }
  }
}
