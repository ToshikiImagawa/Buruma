import { useEffect, useState } from 'react'
import type { BranchInfo, WorktreeCreateParams } from '@domain'
import { BranchCombobox } from '@/components/branch-combobox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface WorktreeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repoPath: string
  localBranches: BranchInfo[]
  remoteBranches: BranchInfo[]
  defaultBranch: string
  onSuggestPath: (repoPath: string, branch: string) => Promise<string>
  onSubmit: (params: WorktreeCreateParams) => void
}

/** リモートブランチ名からリモート名プレフィックス（origin/ 等）を除去 */
const stripRemotePrefix = (name: string) => name.replace(/^[^/]+\//, '')

export function WorktreeCreateDialog({
  open,
  onOpenChange,
  repoPath,
  localBranches,
  remoteBranches,
  defaultBranch,
  onSuggestPath,
  onSubmit,
}: WorktreeCreateDialogProps) {
  const [branch, setBranch] = useState('')
  const [worktreePath, setWorktreePath] = useState('')
  const [createNewBranch, setCreateNewBranch] = useState(true)
  const [startPoint, setStartPoint] = useState('')

  useEffect(() => {
    if (open) {
      setBranch('')
      setWorktreePath('')
      setCreateNewBranch(true)
      setStartPoint(defaultBranch)
    }
  }, [open, defaultBranch])

  const handleBranchChange = (selectedBranch: string) => {
    const isRemote = remoteBranches.some((b) => b.name === selectedBranch)
    const isLocal = localBranches.some((b) => b.name === selectedBranch)
    if (isRemote) {
      // リモートブランチ: ブランチ名は origin/ を除去、開始ポイントは完全名
      setBranch(stripRemotePrefix(selectedBranch))
      setStartPoint(selectedBranch)
    } else if (isLocal) {
      setBranch(selectedBranch)
      setStartPoint(selectedBranch)
    } else {
      // 自由入力: 対応するブランチがないのでデフォルトブランチを開始ポイントに
      setBranch(selectedBranch)
      setStartPoint(defaultBranch)
    }
  }

  // パス提案はブランチ名（origin/ 除去済み）で行う
  useEffect(() => {
    if (!branch) return
    let cancelled = false
    onSuggestPath(repoPath, branch).then((path) => {
      if (!cancelled) setWorktreePath(path)
    })
    return () => {
      cancelled = true
    }
  }, [branch, repoPath, onSuggestPath])

  const canSubmit = branch.trim() !== '' && worktreePath.trim() !== ''

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      repoPath,
      worktreePath,
      branch: branch.trim(),
      createNewBranch,
      startPoint: startPoint.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ワークツリーを作成</DialogTitle>
          <DialogDescription>新しいワークツリーを作成します。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wt-branch">ブランチ名</Label>
            <BranchCombobox
              localBranches={localBranches}
              remoteBranches={remoteBranches}
              value={branch}
              onValueChange={handleBranchChange}
              placeholder="ブランチを選択または入力..."
              allowFreeInput={createNewBranch}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wt-path">作成先パス</Label>
            <Input
              id="wt-path"
              value={worktreePath}
              onChange={(e) => setWorktreePath(e.target.value)}
              placeholder="/path/to/worktree"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="wt-new-branch">新しいブランチを作成</Label>
            <Switch id="wt-new-branch" checked={createNewBranch} onCheckedChange={setCreateNewBranch} />
          </div>

          {createNewBranch && (
            <div className="space-y-2">
              <Label htmlFor="wt-start-point">開始ポイント（任意）</Label>
              <BranchCombobox
                localBranches={localBranches}
                remoteBranches={remoteBranches}
                value={startPoint}
                onValueChange={setStartPoint}
                placeholder="ブランチを選択または入力..."
                allowFreeInput
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
