import { useCallback, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { Loader2, Sparkles } from 'lucide-react'
import { useCommitViewModel } from '../use-commit-viewmodel'

interface CommitFormProps {
  worktreePath: string
  hasStagedFiles: boolean
  onCommitted: () => void
}

export function CommitForm({ worktreePath, hasStagedFiles, onCommitted }: CommitFormProps) {
  const { loading, generating, generateError, commit, generateCommitMessage } = useCommitViewModel()
  const [message, setMessage] = useState('')
  const [amend, setAmend] = useState(false)
  const [showAmendConfirm, setShowAmendConfirm] = useState(false)

  const canCommit = (hasStagedFiles || amend) && message.trim().length > 0 && !loading

  const handleCommit = useCallback(() => {
    if (!canCommit) return
    if (amend && !showAmendConfirm) {
      setShowAmendConfirm(true)
      return
    }
    commit(worktreePath, message, amend)
    setMessage('')
    setAmend(false)
    setShowAmendConfirm(false)
    onCommitted()
  }, [canCommit, amend, showAmendConfirm, commit, worktreePath, message, onCommitted])

  const handleGenerateMessage = useCallback(async () => {
    const generated = await generateCommitMessage(worktreePath)
    if (generated) {
      setMessage(generated.trim())
    }
  }, [generateCommitMessage, worktreePath])

  const handleCancel = useCallback(() => {
    setShowAmendConfirm(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleCommit()
      }
    },
    [handleCommit],
  )

  return (
    <div className="flex flex-col gap-2 p-2">
      <textarea
        className="min-h-[80px] w-full resize-none rounded border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="コミットメッセージを入力..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading || generating}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="amend" checked={amend} onCheckedChange={setAmend} disabled={loading} />
          <Label htmlFor="amend" className="text-xs">
            Amend
          </Label>
        </div>
        {showAmendConfirm ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-destructive">直前のコミットを修正しますか？</span>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleCommit} disabled={loading}>
              確認
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancel}>
              キャンセル
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleGenerateMessage}
                    disabled={!hasStagedFiles || generating || loading}
                    aria-label="コミットメッセージを作成"
                  >
                    {generating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>コミットメッセージを作成</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" className="h-7" onClick={handleCommit} disabled={!canCommit}>
              {loading ? 'コミット中...' : 'コミット'}
            </Button>
          </div>
        )}
      </div>
      {!hasStagedFiles && !amend && <p className="text-xs text-muted-foreground">ステージ済みのファイルがありません</p>}
      {generateError && <p className="text-xs text-destructive">{generateError}</p>}
    </div>
  )
}
