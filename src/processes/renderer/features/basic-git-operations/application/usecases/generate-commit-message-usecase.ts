import type { FileDiff } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AiAssistRepository } from '../repositories/ai-assist-repository'

export class GenerateCommitMessageUseCase implements FunctionUseCase<{ worktreePath: string }, Promise<string>> {
  constructor(private readonly repository: AiAssistRepository) {}

  async invoke(input: { worktreePath: string }): Promise<string> {
    const diffs = await this.repository.getDiffStaged(input.worktreePath)
    if (diffs.length === 0) {
      throw new Error('ステージ済みの変更がありません')
    }
    const diffText = formatDiffsAsText(diffs)
    const prompt = buildCommitMessagePrompt(diffText)
    return this.repository.generateText(input.worktreePath, prompt)
  }
}

function formatDiffsAsText(diffs: FileDiff[]): string {
  return diffs
    .map((file) => {
      const header = `--- ${file.oldFilePath ?? file.filePath}\n+++ ${file.filePath}`
      const hunks = file.hunks
        .map((hunk) => {
          const lines = hunk.lines.map((line) => {
            switch (line.type) {
              case 'add':
                return `+${line.content}`
              case 'delete':
                return `-${line.content}`
              default:
                return ` ${line.content}`
            }
          })
          return `${hunk.header}\n${lines.join('\n')}`
        })
        .join('\n')
      return `${header}\n${hunks}`
    })
    .join('\n')
}

function buildCommitMessagePrompt(diffText: string): string {
  const maxLength = 100000
  const truncated = diffText.length > maxLength ? diffText.slice(0, maxLength) + '\n\n(truncated)' : diffText

  return `以下のステージング差分に対する適切なコミットメッセージを1つだけ生成してください。

ルール:
- 日本語で記述
- プレフィックス付き: [add], [update], [fix], [refactoring], [remove], [docs], [test]
- 簡潔に変更内容を説明（1〜2行）
- コミットメッセージのみを出力し、説明や装飾は含めない

差分:
\`\`\`diff
${truncated}
\`\`\``
}
