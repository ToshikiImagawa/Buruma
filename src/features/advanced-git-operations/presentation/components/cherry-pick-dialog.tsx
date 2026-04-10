import { useCallback, useEffect, useRef, useState } from 'react'
import type { CherryPickResult } from '@domain'
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
import { useCherryPickViewModel } from '../use-cherry-pick-viewmodel'

interface CherryPickDialogProps {
  worktreePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConflict?: (files: string[]) => void
  defaultCommitHash?: string
}

export function CherryPickDialog({
  worktreePath,
  open,
  onOpenChange,
  onConflict,
  defaultCommitHash = '',
}: CherryPickDialogProps) {
  const { loading, cherryPickResult, cherryPick } = useCherryPickViewModel()
  const [commitInput, setCommitInput] = useState(defaultCommitHash)
  const lastHandledResultRef = useRef<CherryPickResult | null>(null)

  useEffect(() => {
    if (open && defaultCommitHash) {
      setCommitInput(defaultCommitHash)
    }
  }, [open, defaultCommitHash])

  // コンフリクト発生時に親コンポーネントへ通知（同じ result で複数回呼ばれないよう ref ガード）
  useEffect(() => {
    if (
      cherryPickResult?.status === 'conflict' &&
      cherryPickResult.conflictFiles &&
      onConflict &&
      lastHandledResultRef.current !== cherryPickResult
    ) {
      lastHandledResultRef.current = cherryPickResult
      onConflict(cherryPickResult.conflictFiles)
    }
  }, [cherryPickResult, onConflict])

  const parseCommits = useCallback((input: string): string[] => {
    return input
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [])

  const commits = parseCommits(commitInput)
  const canCherryPick = commits.length > 0 && !loading

  const handleCherryPick = useCallback(() => {
    if (!canCherryPick) return
    cherryPick({ worktreePath, commits })
  }, [canCherryPick, cherryPick, worktreePath, commits])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCommitInput('')
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>チェリーピック</DialogTitle>
          <DialogDescription>
            適用するコミットハッシュを入力してください（カンマ区切りまたは1行ずつ）。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* コミットハッシュ入力 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">コミットハッシュ</span>
            <Input
              className="h-8 text-sm"
              placeholder="abc1234, def5678..."
              value={commitInput}
              onChange={(e) => setCommitInput(e.target.value)}
              disabled={loading}
            />
            {commits.length > 0 && (
              <p className="text-xs text-muted-foreground">{commits.length} 件のコミットが対象です</p>
            )}
          </div>

          {/* 結果表示 */}
          {cherryPickResult && (
            <div
              className={`rounded border p-2 text-sm ${
                cherryPickResult.status === 'success'
                  ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {cherryPickResult.status === 'success' && (
                <p>チェリーピックが完了しました。({cherryPickResult.appliedCommits.length} 件適用)</p>
              )}
              {cherryPickResult.status === 'conflict' && (
                <>
                  <p>コンフリクトが発生しました。</p>
                  {cherryPickResult.conflictFiles && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {cherryPickResult.conflictFiles.map((file) => (
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
          <Button size="sm" onClick={handleCherryPick} disabled={!canCherryPick}>
            {loading ? 'チェリーピック中...' : 'Cherry-pick'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
