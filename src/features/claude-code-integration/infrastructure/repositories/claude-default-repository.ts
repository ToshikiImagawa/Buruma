import type {
  ClaudeAuthStatus,
  ClaudeCommand,
  ClaudeOutput,
  ClaudeSession,
  DiffTarget,
  ExplainResult,
  ReviewResult,
} from '@domain'
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

  async reviewDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void> {
    const result = await window.electronAPI.claude.reviewDiff({ worktreePath, diffTarget, diffText })
    if (result.success === false) throw new Error(result.error.message)
  }

  async explainDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void> {
    const result = await window.electronAPI.claude.explainDiff({ worktreePath, diffTarget, diffText })
    if (result.success === false) throw new Error(result.error.message)
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

  onReviewResult(callback: (result: ReviewResult) => void): () => void {
    return window.electronAPI.claude.onReviewResult(callback)
  }

  onExplainResult(callback: (result: ExplainResult) => void): () => void {
    return window.electronAPI.claude.onExplainResult(callback)
  }

  async checkAuth(): Promise<ClaudeAuthStatus> {
    const result = await window.electronAPI.claude.checkAuth()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async login(): Promise<void> {
    const result = await window.electronAPI.claude.login()
    if (result.success === false) throw new Error(result.error.message)
  }

  async logout(): Promise<void> {
    const result = await window.electronAPI.claude.logout()
    if (result.success === false) throw new Error(result.error.message)
  }
}
