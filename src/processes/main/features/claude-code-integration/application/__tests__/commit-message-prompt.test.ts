import { describe, expect, it } from 'vitest'
import { DEFAULT_COMMIT_MESSAGE_RULES, buildCommitMessagePrompt } from '../prompts/commit-message'

describe('buildCommitMessagePrompt', () => {
  const sampleDiff = `--- a/src/main.ts\n+++ b/src/main.ts\n@@ -1,3 +1,4 @@\n import { app } from 'electron'\n+import { foo } from './foo'\n`

  it('デフォルトルールでプロンプトを生成する', () => {
    const prompt = buildCommitMessagePrompt(sampleDiff)
    expect(prompt).toContain(DEFAULT_COMMIT_MESSAGE_RULES)
    expect(prompt).toContain(sampleDiff)
    expect(prompt).toContain('コミットメッセージを1つだけ生成')
  })

  it('カスタムルールが指定された場合はそちらを使う', () => {
    const customRules = '- English only\n- Use conventional commits'
    const prompt = buildCommitMessagePrompt(sampleDiff, customRules)
    expect(prompt).toContain(customRules)
    expect(prompt).not.toContain(DEFAULT_COMMIT_MESSAGE_RULES)
  })

  it('カスタムルールが null の場合はデフォルトを使う', () => {
    const prompt = buildCommitMessagePrompt(sampleDiff, null)
    expect(prompt).toContain(DEFAULT_COMMIT_MESSAGE_RULES)
  })

  it('カスタムルールが空文字の場合はデフォルトを使う', () => {
    const prompt = buildCommitMessagePrompt(sampleDiff, '   ')
    expect(prompt).toContain(DEFAULT_COMMIT_MESSAGE_RULES)
  })

  it('100000文字を超える差分は切り詰められる', () => {
    const largeDiff = 'a'.repeat(100001)
    const prompt = buildCommitMessagePrompt(largeDiff)
    expect(prompt).toContain('(truncated)')
    expect(prompt).not.toContain('a'.repeat(100001))
  })

  it('100000文字以下の差分はそのまま含まれる', () => {
    const diff = 'a'.repeat(100000)
    const prompt = buildCommitMessagePrompt(diff)
    expect(prompt).not.toContain('(truncated)')
    expect(prompt).toContain(diff)
  })
})
