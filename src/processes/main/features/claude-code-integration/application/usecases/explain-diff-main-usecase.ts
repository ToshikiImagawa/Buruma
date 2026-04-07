import type { DiffTarget, ExplainResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeOutputParser } from '../repositories/claude-output-parser'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'
import { buildExplainDiffPrompt } from '../prompts/explain-diff'

export interface ExplainDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ExplainDiffMainUseCase implements FunctionUseCase<ExplainDiffInput, Promise<ExplainResult>> {
  constructor(
    private readonly processRepository: ClaudeProcessRepository,
    private readonly outputParser: ClaudeOutputParser,
  ) {}

  async invoke(input: ExplainDiffInput): Promise<ExplainResult> {
    if (!input.diffText.trim()) {
      return { worktreePath: input.worktreePath, explanation: '解説対象の差分がありません' }
    }

    const prompt = buildExplainDiffPrompt(input.diffText)
    const rawOutput = await this.processRepository.generateText(input.worktreePath, prompt)
    const explanation = this.outputParser.parseExplanation(rawOutput)

    return { worktreePath: input.worktreePath, explanation }
  }
}
