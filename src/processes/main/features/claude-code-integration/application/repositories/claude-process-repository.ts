import type { ClaudeCommand, ClaudeOutput, ClaudeSession } from '@domain'

export interface ClaudeProcessRepository {
  startSession(worktreePath: string): Promise<ClaudeSession>
  stopSession(worktreePath: string): Promise<void>
  sendCommand(command: ClaudeCommand): Promise<void>
  getSession(worktreePath: string): ClaudeSession | null
  getAllSessions(): ClaudeSession[]
  getOutputHistory(worktreePath: string): ClaudeOutput[]
  stopAllSessions(): Promise<void>
  onOutput(listener: (output: ClaudeOutput) => void): () => void
  onSessionChanged(listener: (session: ClaudeSession) => void): () => void
}
