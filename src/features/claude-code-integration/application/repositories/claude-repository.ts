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

export interface ClaudeRepository {
  startSession(worktreePath: string): Promise<ClaudeSession>
  stopSession(sessionId: string): Promise<void>
  getSession(sessionId: string): Promise<ClaudeSession | null>
  getAllSessions(): Promise<ClaudeSession[]>
  sendCommand(command: ClaudeCommand): Promise<void>
  getOutput(sessionId: string): Promise<ClaudeOutput[]>
  reviewDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void>
  explainDiff(worktreePath: string, diffTarget: DiffTarget, diffText: string): Promise<void>
  onOutput(callback: (output: ClaudeOutput) => void): () => void
  onSessionChanged(callback: (session: ClaudeSession) => void): () => void
  onCommandCompleted(callback: (data: { worktreePath: string; sessionId?: string }) => void): () => void
  onReviewResult(callback: (result: ReviewResult) => void): () => void
  onExplainResult(callback: (result: ExplainResult) => void): () => void
  resolveConflict(request: ConflictResolveAIRequest): Promise<void>
  onConflictResolved(callback: (result: ConflictResolveResult) => void): () => void
  generateCommitMessage(worktreePath: string, diffText: string, rules?: string | null): Promise<string>
  checkAuth(): Promise<ClaudeAuthStatus>
  login(): Promise<void>
  logout(): Promise<void>
}
