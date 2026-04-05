import { useCallback, useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useMergeViewModel } from '../use-merge-viewmodel'

interface MergeDialogProps {
  worktreePath: string
  currentBranch: string
  branches: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConflict?: (files: string[]) => void
  defaultTargetBranch?: string
}

export function MergeDialog({
  worktreePath,
  currentBranch,
  branches,
  open,
  onOpenChange,
  onConflict,
  defaultTargetBranch = '',
}: MergeDialogProps) {
  const { loading, mergeResult, merge } = useMergeViewModel()
  const [targetBranch, setTargetBranch] = useState(defaultTargetBranch)
  const [strategy, setStrategy] = useState<'fast-forward' | 'no-ff'>('fast-forward')

  useEffect(() => {
    if (open && defaultTargetBranch) {
      setTargetBranch(defaultTargetBranch)
    }
  }, [open, defaultTargetBranch])

  const canMerge = targetBranch !== '' && !loading

  const handleMerge = useCallback(() => {
    if (!canMerge) return
    merge({ worktreePath, branch: targetBranch, strategy })
  }, [canMerge, merge, worktreePath, targetBranch, strategy])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setTargetBranch('')
        setStrategy('fast-forward')
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  // コンフリクト発生時にコールバックを呼ぶ
  if (mergeResult?.status === 'conflict' && mergeResult.conflictFiles && onConflict) {
    onConflict(mergeResult.conflictFiles)
  }

  const availableBranches = branches.filter((b) => b !== currentBranch)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ブランチをマージ</DialogTitle>
          <DialogDescription>
            現在のブランチ: <span className="font-medium">{currentBranch}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* マージ対象ブランチ選択 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">マージ対象ブランチ</span>
            <Select value={targetBranch} onValueChange={setTargetBranch}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="ブランチを選択..." />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch} value={branch} className="text-sm">
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* マージ戦略選択 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">マージ戦略</span>
            <div className="flex gap-2">
              <Button
                variant={strategy === 'fast-forward' ? 'default' : 'outline'}
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={() => setStrategy('fast-forward')}
                disabled={loading}
              >
                Fast-forward
              </Button>
              <Button
                variant={strategy === 'no-ff' ? 'default' : 'outline'}
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={() => setStrategy('no-ff')}
                disabled={loading}
              >
                No Fast-forward
              </Button>
            </div>
          </div>

          {/* 結果表示 */}
          {mergeResult && (
            <div
              className={`rounded border p-2 text-sm ${
                mergeResult.status === 'success'
                  ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                  : mergeResult.status === 'already-up-to-date'
                    ? 'border-muted bg-muted/50 text-muted-foreground'
                    : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {mergeResult.status === 'success' && <p>マージが完了しました。</p>}
              {mergeResult.status === 'already-up-to-date' && <p>既に最新の状態です。</p>}
              {mergeResult.status === 'conflict' && (
                <>
                  <p>コンフリクトが発生しました。</p>
                  {mergeResult.conflictFiles && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {mergeResult.conflictFiles.map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={loading}>
            閉じる
          </Button>
          <Button size="sm" onClick={handleMerge} disabled={!canMerge}>
            {loading ? 'マージ中...' : 'マージ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
