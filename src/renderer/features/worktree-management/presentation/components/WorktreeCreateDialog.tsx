import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import type { WorktreeCreateParams } from '@shared/domain'

interface WorktreeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repoPath: string
  onSubmit: (params: WorktreeCreateParams) => void
}

export function WorktreeCreateDialog({
  open,
  onOpenChange,
  repoPath,
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
      setStartPoint('')
    }
  }, [open])

  useEffect(() => {
    if (branch) {
      const sanitized = branch.replace(/[/\\:*?"<>|]/g, '-')
      const repoName = repoPath.split('/').pop() ?? 'repo'
      const parent = repoPath.split('/').slice(0, -1).join('/')
      setWorktreePath(`${parent}/${repoName}+${sanitized}`)
    }
  }, [branch, repoPath])

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
            <Input
              id="wt-branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="feature/my-branch"
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
            <Switch
              id="wt-new-branch"
              checked={createNewBranch}
              onCheckedChange={setCreateNewBranch}
            />
          </div>

          {createNewBranch && (
            <div className="space-y-2">
              <Label htmlFor="wt-start-point">開始ポイント（任意）</Label>
              <Input
                id="wt-start-point"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="HEAD"
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
