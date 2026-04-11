import { useCallback, useEffect, useState } from 'react'
import type { GitStatus, StashEntry } from '@domain'
import { FileChangeIcon } from '@/components/FileChangeIcon'
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
import { Separator } from '@/components/ui/separator'
import { useStashViewModel } from '../use-stash-viewmodel'

interface StashManagerProps {
  worktreePath: string
  status: GitStatus | null
  selectedFile?: string | null
  onFileSelect?: (filePath: string) => void
}

export function StashManager({ worktreePath, status, selectedFile, onFileSelect }: StashManagerProps) {
  const { loading, stashes, stashSave, stashList, stashPop, stashApply, stashDrop, stashClear } = useStashViewModel()
  const [message, setMessage] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  // マウント時にスタッシュ一覧を取得
  useEffect(() => {
    stashList(worktreePath)
  }, [worktreePath, stashList])

  const handleSave = useCallback(() => {
    stashSave({ worktreePath, message: message.trim() || undefined })
    setMessage('')
    stashList(worktreePath)
  }, [worktreePath, message, stashSave, stashList])

  const handlePop = useCallback(
    (index: number) => {
      stashPop(worktreePath, index)
      stashList(worktreePath)
    },
    [worktreePath, stashPop, stashList],
  )

  const handleApply = useCallback(
    (index: number) => {
      stashApply(worktreePath, index)
    },
    [worktreePath, stashApply],
  )

  const handleDrop = useCallback(
    (index: number) => {
      stashDrop(worktreePath, index)
      setDropTarget(null)
      stashList(worktreePath)
    },
    [worktreePath, stashDrop, stashList],
  )

  const handleClearAll = useCallback(() => {
    stashClear(worktreePath)
    setShowClearConfirm(false)
    stashList(worktreePath)
  }, [worktreePath, stashClear, stashList])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave()
      }
    },
    [handleSave],
  )

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* スタッシュ保存 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">スタッシュ保存</span>
        <div className="flex items-center gap-1">
          <Input
            className="h-7 flex-1 text-xs"
            placeholder="メッセージ（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={loading || (!status?.staged.length && !status?.unstaged.length)}
          >
            {loading ? '保存中...' : 'Stash'}
          </Button>
        </div>
        {status && (status.staged.length > 0 || status.unstaged.length > 0) && (
          <div className="mt-1 space-y-0.5">
            <span className="text-xs text-muted-foreground">
              保存対象 ({status.staged.length + status.unstaged.length} ファイル)
            </span>
            <div className="max-h-32 overflow-auto rounded border border-border/50 p-1">
              {status.staged.map((file) => (
                <button
                  key={`staged-${file.path}`}
                  className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-accent ${selectedFile === file.path ? 'bg-accent' : ''}`}
                  onClick={() => onFileSelect?.(file.path)}
                >
                  <FileChangeIcon status={file.status} />
                  <span className="truncate">{file.path}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">staged</span>
                </button>
              ))}
              {status.unstaged.map((file) => (
                <button
                  key={`unstaged-${file.path}`}
                  className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-accent ${selectedFile === file.path ? 'bg-accent' : ''}`}
                  onClick={() => onFileSelect?.(file.path)}
                >
                  <FileChangeIcon status={file.status} />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* スタッシュ一覧 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">スタッシュ一覧 ({stashes.length})</span>
        {stashes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive"
            onClick={() => setShowClearConfirm(true)}
            disabled={loading}
          >
            全削除
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {stashes.map((entry: StashEntry) => (
          <div key={entry.index} className="group flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm">{entry.message || `stash@{${entry.index}}`}</p>
              <p className="text-xs text-muted-foreground">{entry.date}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {dropTarget === entry.index ? (
                <>
                  <span className="text-xs text-destructive">削除？</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => handleDrop(entry.index)}
                    disabled={loading}
                  >
                    確認
                  </Button>
                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setDropTarget(null)}>
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handlePop(entry.index)}
                    disabled={loading}
                  >
                    Pop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleApply(entry.index)}
                    disabled={loading}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() => setDropTarget(entry.index)}
                    disabled={loading}
                  >
                    Drop
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {stashes.length === 0 && !loading && (
          <p className="px-2 text-xs text-muted-foreground">スタッシュはありません</p>
        )}
      </div>

      {/* 全削除確認ダイアログ */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>スタッシュの全削除</DialogTitle>
            <DialogDescription>すべてのスタッシュを削除します。この操作は元に戻せません。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={loading}>
              全削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
