import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Label } from '@renderer/components/ui/label'
import type { WorktreeInfo, WorktreeDeleteParams } from '@shared/domain'

interface WorktreeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worktree: WorktreeInfo
  repoPath: string
  onConfirm: (params: WorktreeDeleteParams) => void
}

export function WorktreeDeleteDialog({
  open,
  onOpenChange,
  worktree,
  repoPath,
  onConfirm,
}: WorktreeDeleteDialogProps) {
  const [force, setForce] = useState(false)
  const displayName = worktree.path.split('/').pop() ?? worktree.path

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              onConfirm({ repoPath, worktreePath: worktree.path, force })
            }
          >
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
