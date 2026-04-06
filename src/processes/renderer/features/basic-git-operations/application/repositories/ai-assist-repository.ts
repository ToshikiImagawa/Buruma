import type { FileDiff } from '@domain'

export interface AiAssistRepository {
  getDiffStaged(worktreePath: string): Promise<FileDiff[]>
  generateText(worktreePath: string, prompt: string): Promise<string>
}
