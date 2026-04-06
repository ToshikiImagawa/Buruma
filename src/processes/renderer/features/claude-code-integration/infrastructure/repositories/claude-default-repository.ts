import type { ClaudeCommand, ClaudeOutput, ClaudeSession } from '@domain'
import type { ClaudeRepository } from '../../application/repositories/claude-repository'

export class ClaudeDefaultRepository implements ClaudeRepository {
  async startSession(worktreePath: string): Promise<ClaudeSession> {
    const result = await window.electronAPI.claude.startSession({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async stopSession(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.claude.stopSession({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
  }

  async getSession(worktreePath: string): Promise<ClaudeSession | null> {
    const result = await window.electronAPI.claude.getSession({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getAllSessions(): Promise<ClaudeSession[]> {
    const result = await window.electronAPI.claude.getAllSessions()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async sendCommand(command: ClaudeCommand): Promise<void> {
    const result = await window.electronAPI.claude.sendCommand(command)
    if (result.success === false) throw new Error(result.error.message)
  }

  async getOutput(worktreePath: string): Promise<ClaudeOutput[]> {
    const result = await window.electronAPI.claude.getOutput({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  onOutput(callback: (output: ClaudeOutput) => void): () => void {
    return window.electronAPI.claude.onOutput(callback)
  }

  onSessionChanged(callback: (session: ClaudeSession) => void): () => void {
    return window.electronAPI.claude.onSessionChanged(callback)
  }

  onCommandCompleted(callback: (data: { worktreePath: string }) => void): () => void {
    return window.electronAPI.claude.onCommandCompleted(callback)
  }
}
