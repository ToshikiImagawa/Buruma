import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorktreeCreateDialog } from '../WorktreeCreateDialog'

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  repoPath: '/repo',
  localBranches: [
    { name: 'main', hash: 'abc1234', isHead: true },
    { name: 'feature/existing', hash: 'def5678', isHead: false },
  ],
  remoteBranches: [{ name: 'origin/main', hash: 'abc1234', isHead: false }],
  defaultBranch: 'main',
  onSuggestPath: vi.fn().mockResolvedValue('/repo_feature-new'),
  onSubmit: vi.fn(),
}

describe('WorktreeCreateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ダイアログが表示される', () => {
    render(<WorktreeCreateDialog {...defaultProps} />)
    expect(screen.getByText('ワークツリーを作成')).toBeDefined()
    expect(screen.getByText('新しいワークツリーを作成します。')).toBeDefined()
  })

  it('invokeCommand を直接 import していない', async () => {
    // WorktreeCreateDialog のソースに invokeCommand が含まれないことを確認
    // （構造的テスト：Dialog は props 経由でのみ外部通信する）
    const module = await import('../WorktreeCreateDialog')
    const source = module.WorktreeCreateDialog.toString()
    expect(source).not.toContain('invokeCommand')
  })

  it('「新しいブランチを作成」スイッチがデフォルトで ON', () => {
    render(<WorktreeCreateDialog {...defaultProps} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl.getAttribute('data-state')).toBe('checked')
  })

  it('開始ポイントのデフォルト値が defaultBranch', () => {
    render(<WorktreeCreateDialog {...defaultProps} />)
    // 開始ポイントフィールドに defaultBranch の値が表示される
    const startPointButtons = screen.getAllByRole('combobox')
    // 2つ目の combobox が開始ポイント
    expect(startPointButtons[1].textContent).toContain('main')
  })

  it('ブランチ未入力時は作成ボタンが無効', () => {
    render(<WorktreeCreateDialog {...defaultProps} />)
    const submitButton = screen.getByRole('button', { name: '作成' })
    expect(submitButton).toBeDisabled()
  })

  it('「新しいブランチを作成」OFF 時に開始ポイント欄が非表示', async () => {
    const user = userEvent.setup()
    render(<WorktreeCreateDialog {...defaultProps} />)

    // 初期状態: combobox が2つ（ブランチ名 + 開始ポイント）
    expect(screen.getAllByRole('combobox')).toHaveLength(2)

    // スイッチを OFF にする
    const switchEl = screen.getByRole('switch')
    await user.click(switchEl)

    // 開始ポイントの combobox が消える → combobox は1つ
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
  })

  it('キャンセルボタンで onOpenChange(false) が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<WorktreeCreateDialog {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })
})
