import type {
  ClaudeAuthStatus,
  ClaudeCommand,
  ClaudeOutput,
  ClaudeSession,
  ConflictResolveAIRequest,
  ConflictResolveResult,
  DiffTarget,
  ExplainResult,
  ReviewResult,
} from '@domain'
import type { ClaudeRepository } from '../../application/repositories/claude-repository'
import { invokeCommand } from '@lib/invoke/commands'
import { listenEventSync } from '@lib/invoke/events'

export class ClaudeDefaultRepository implements ClaudeRepository {
  async startSession(worktreePath: string): Promise<ClaudeSession> {
    const result = await invokeCommand('claude_start_session', { args: { worktreePath } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async stopSession(sessionId: string): Promise<void> {
    const result = await invokeCommand('claude_stop_session', { args: { sessionId } })
    if (result.success === false) throw new Error(result.error.message)
  }

  async getSession(sessionId: string): Promise<ClaudeSession | null> {
    const result = await invokeCommand('claude_get_session', { args: { sessionId } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getAllSessions(): Promise<ClaudeSession[]> {
    const result = await invokeCommand('claude_get_all_sessions')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async sendCommand(command: ClaudeCommand): Promise<void> {
    const result = await invokeCommand('claude_send_command', { command })
    if (result.success === false) throw new Error(result.error.message)
  }

  async getOutput(sessionId: string): Promise<ClaudeOutput[]> {
    const result = await invokeCommand('claude_get_output', { args: { sessionId } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async reviewDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void> {
    const result = await invokeCommand('claude_review_diff', { args: { worktreePath, diffTarget, diffText } })
    if (result.success === false) throw new Error(result.error.message)
  }

  async explainDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void> {
    const result = await invokeCommand('claude_explain_diff', { args: { worktreePath, diffTarget, diffText } })
    if (result.success === false) throw new Error(result.error.message)
  }

  onOutput(callback: (output: ClaudeOutput) => void): () => void {
    return listenEventSync('claude-output', callback)
  }

  onSessionChanged(callback: (session: ClaudeSession) => void): () => void {
    return listenEventSync('claude-session-changed', callback)
  }

  onCommandCompleted(callback: (data: { worktreePath: string }) => void): () => void {
    return listenEventSync('claude-command-completed', callback)
  }

  onReviewResult(callback: (result: ReviewResult) => void): () => void {
    return listenEventSync('claude-review-result', callback)
  }

  onExplainResult(callback: (result: ExplainResult) => void): () => void {
    return listenEventSync('claude-explain-result', callback)
  }

  async resolveConflict(request: ConflictResolveAIRequest): Promise<void> {
    const result = await invokeCommand('claude_resolve_conflict', { args: request })
    if (result.success === false) throw new Error(result.error.message)
  }

  onConflictResolved(callback: (result: ConflictResolveResult) => void): () => void {
    return listenEventSync('claude-conflict-resolved', callback)
  }

  async generateCommitMessage(worktreePath: string, diffText: string, rules?: string | null): Promise<string> {
    const result = await invokeCommand('claude_generate_commit_message', {
      args: { worktreePath, diffText, rules: rules ?? null },
    })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async checkAuth(): Promise<ClaudeAuthStatus> {
    const result = await invokeCommand('claude_check_auth')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async login(): Promise<void> {
    const result = await invokeCommand('claude_login')
    if (result.success === false) throw new Error(result.error.message)
  }

  async logout(): Promise<void> {
    const result = await invokeCommand('claude_logout')
    if (result.success === false) throw new Error(result.error.message)
  }
}
