import type { AppSettings, GenerateCommitMessageArgs } from '@domain'
import type { FunctionUseCase, SupplierUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'
import { buildCommitMessagePrompt } from '../prompts/commit-message'

export class GenerateCommitMessageMainUseCase implements FunctionUseCase<GenerateCommitMessageArgs, Promise<string>> {
  constructor(
    private readonly processRepository: ClaudeProcessRepository,
    private readonly getSettingsUseCase: SupplierUseCase<AppSettings>,
  ) {}

  async invoke(input: GenerateCommitMessageArgs): Promise<string> {
    if (!input.diffText.trim()) {
      throw new Error('ステージ済みの変更がありません')
    }
    const settings = this.getSettingsUseCase.invoke()
    const prompt = buildCommitMessagePrompt(input.diffText, settings.commitMessageRules)
    return this.processRepository.generateText(input.worktreePath, prompt)
  }
}
