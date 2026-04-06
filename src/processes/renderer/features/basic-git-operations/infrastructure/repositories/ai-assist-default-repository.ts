import type { FileDiff } from '@domain'
import type { AiAssistRepository } from '../../application/repositories/ai-assist-repository'

export class AiAssistDefaultRepository implements AiAssistRepository {
  async getDiffStaged(worktreePath: string): Promise<FileDiff[]> {
    const result = await window.electronAPI.git.diffStaged({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async generateText(worktreePath: string, prompt: string): Promise<string> {
    const result = await window.electronAPI.claude.generateText({ worktreePath, prompt })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }
}
