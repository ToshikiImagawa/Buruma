import { useEffect, useState } from 'react'
import type { WorktreeDeleteParams, WorktreeInfo } from '@domain'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface WorktreeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worktree: WorktreeInfo
  repoPath: string
  /** 全ワークツリー一覧（他WTでのブランチ使用中チェック用） */
  worktrees: WorktreeInfo[]
  onConfirm: (params: WorktreeDeleteParams) => void
}

export function WorktreeDeleteDialog({
  open,
  onOpenChange,
  worktree,
  repoPath,
  worktrees,
  onConfirm,
}: WorktreeDeleteDialogProps) {
  const [force, setForce] = useState(false)
  const [deleteBranch, setDeleteBranch] = useState(true)
  const displayName = worktree.path.split('/').pop() ?? worktree.path

  useEffect(() => {
    if (open) {
      setForce(false)
      setDeleteBranch(true)
    }
  }, [open])

  const isBranchUsedByOther =
    worktree.branch != null && worktrees.some((wt) => wt.path !== worktree.path && wt.branch === worktree.branch)

  const hasBranch = worktree.branch != null

  if (worktree.isMain) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>削除できません</DialogTitle>
            <DialogDescription>メインワークツリーは削除できません。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ワークツリーを削除</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{displayName}</span> を削除しますか？
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {worktree.isDirty && (
            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                このワークツリーには未コミットの変更があります。
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="wt-force">強制削除（未コミット変更を破棄）</Label>
            <Switch id="wt-force" checked={force} onCheckedChange={setForce} />
          </div>

          {hasBranch && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wt-delete-branch"
                  checked={isBranchUsedByOther ? false : deleteBranch}
                  onCheckedChange={(checked) => setDeleteBranch(checked === true)}
                  disabled={isBranchUsedByOther}
                />
                <Label htmlFor="wt-delete-branch" className={isBranchUsedByOther ? 'text-muted-foreground' : ''}>
                  ローカルブランチも削除する（{worktree.branch}）
                </Label>
              </div>
              {isBranchUsedByOther && (
                <p className="ml-6 text-xs text-muted-foreground">他のワークツリーで使用中のため削除できません</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              onConfirm({
                repoPath,
                worktreePath: worktree.path,
                force,
                deleteBranch: hasBranch && !isBranchUsedByOther && deleteBranch,
              })
            }
          >
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
