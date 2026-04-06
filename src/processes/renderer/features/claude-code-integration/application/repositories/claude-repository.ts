import type { ClaudeCommand, ClaudeOutput, ClaudeSession } from '@domain'

export interface ClaudeRepository {
  startSession(worktreePath: string): Promise<ClaudeSession>
  stopSession(worktreePath: string): Promise<void>
  getSession(worktreePath: string): Promise<ClaudeSession | null>
  getAllSessions(): Promise<ClaudeSession[]>
  sendCommand(command: ClaudeCommand): Promise<void>
  getOutput(worktreePath: string): Promise<ClaudeOutput[]>
  onOutput(callback: (output: ClaudeOutput) => void): () => void
  onSessionChanged(callback: (session: ClaudeSession) => void): () => void
  onCommandCompleted(callback: (data: { worktreePath: string }) => void): () => void
}
