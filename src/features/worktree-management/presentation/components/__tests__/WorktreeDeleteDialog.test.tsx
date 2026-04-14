import type { WorktreeInfo } from '@domain'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorktreeDeleteDialog } from '../WorktreeDeleteDialog'

afterEach(() => cleanup())

const mainWorktree: WorktreeInfo = {
  path: '/repo',
  branch: 'main',
  head: 'abc1234',
  headMessage: 'init',
  isMain: true,
  isDirty: false,
}

const featureWorktree: WorktreeInfo = {
  path: '/repo+feature-test',
  branch: 'feature/test',
  head: 'def5678',
  headMessage: 'feat',
  isMain: false,
  isDirty: false,
}

const detachedWorktree: WorktreeInfo = {
  path: '/repo+detached',
  branch: null,
  head: 'aaa1111',
  headMessage: 'detached',
  isMain: false,
  isDirty: false,
}

const allWorktrees: WorktreeInfo[] = [mainWorktree, featureWorktree]

/** Radix UI Checkbox は button[role=checkbox] をレンダリングするため id で取得 */
function getCheckbox() {
  return document.getElementById('wt-delete-branch') as HTMLButtonElement | null
}

describe('WorktreeDeleteDialog', () => {
  it('メインワークツリーの場合はブランチ削除チェックボックスを表示しない', () => {
    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={mainWorktree}
        repoPath="/repo"
        worktrees={allWorktrees}
        onConfirm={vi.fn()}
      />,
    )
    expect(getCheckbox()).toBeNull()
    expect(screen.getByText('削除できません')).toBeInTheDocument()
  })

  it('ブランチ削除チェックボックスがデフォルト ON で表示される', () => {
    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={featureWorktree}
        repoPath="/repo"
        worktrees={allWorktrees}
        onConfirm={vi.fn()}
      />,
    )
    const checkbox = getCheckbox()!
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.getAttribute('data-state')).toBe('checked')
  })

  it('削除ボタンで deleteBranch=true が渡される（デフォルト）', () => {
    const onConfirm = vi.fn()
    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={featureWorktree}
        repoPath="/repo"
        worktrees={allWorktrees}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '削除' }))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ deleteBranch: true }))
  })

  it('チェックボックスを OFF にすると deleteBranch=false が渡される', () => {
    const onConfirm = vi.fn()
    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={featureWorktree}
        repoPath="/repo"
        worktrees={allWorktrees}
        onConfirm={onConfirm}
      />,
    )
    // Radix UI Checkbox はクリックで状態が変わる
    const checkbox = getCheckbox()!
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: '削除' }))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ deleteBranch: false }))
  })

  it('他のワークツリーで使用中の場合、チェックボックスが無効化される', () => {
    const anotherWt: WorktreeInfo = {
      path: '/repo+another',
      branch: 'feature/test',
      head: 'ghi9012',
      headMessage: 'another',
      isMain: false,
      isDirty: false,
    }
    const worktrees = [mainWorktree, featureWorktree, anotherWt]

    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={featureWorktree}
        repoPath="/repo"
        worktrees={worktrees}
        onConfirm={vi.fn()}
      />,
    )
    const checkbox = getCheckbox()!
    // Radix UI は disabled prop を data-disabled 属性で反映する
    expect(checkbox).toHaveAttribute('data-disabled')
    expect(screen.getByText(/他のワークツリーで使用中/)).toBeInTheDocument()
  })

  it('他WT使用中の場合、削除ボタンで deleteBranch=false が渡される', () => {
    const anotherWt: WorktreeInfo = {
      path: '/repo+another',
      branch: 'feature/test',
      head: 'ghi9012',
      headMessage: 'another',
      isMain: false,
      isDirty: false,
    }
    const worktrees = [mainWorktree, featureWorktree, anotherWt]
    const onConfirm = vi.fn()

    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={featureWorktree}
        repoPath="/repo"
        worktrees={worktrees}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '削除' }))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ deleteBranch: false }))
  })

  it('detached HEAD の場合、ブランチ削除チェックボックスを表示しない', () => {
    render(
      <WorktreeDeleteDialog
        open
        onOpenChange={vi.fn()}
        worktree={detachedWorktree}
        repoPath="/repo"
        worktrees={[mainWorktree, detachedWorktree]}
        onConfirm={vi.fn()}
      />,
    )
    expect(getCheckbox()).toBeNull()
  })
})
