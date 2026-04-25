import { useCallback, useRef, useState } from 'react'
import type { BranchInfo } from '@domain'
import { ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCommitViewModel } from '../use-commit-viewmodel'
import { useRemoteOpsViewModel } from '../use-remote-ops-viewmodel'

interface CommitFormProps {
  worktreePath: string
  hasStagedFiles: boolean
  currentBranch?: BranchInfo
  onCommitted: () => void
}

export function CommitForm({ worktreePath, hasStagedFiles, currentBranch, onCommitted }: CommitFormProps) {
  const { loading, generating, generateError, commit, generateCommitMessage } = useCommitViewModel()
  const { loading: remoteLoading, push } = useRemoteOpsViewModel()
  const [message, setMessage] = useState('')
  const [amend, setAmend] = useState(false)
  const compositionEndTimeRef = useRef(0)
  const [showAmendConfirm, setShowAmendConfirm] = useState(false)
  const [pushing, setPushing] = useState(false)

  const busy = loading || remoteLoading || pushing
  const canCommit = (hasStagedFiles || amend) && message.trim().length > 0 && !busy

  const handleCommit = useCallback(async () => {
    if (!canCommit) return
    if (amend && !showAmendConfirm) {
      setShowAmendConfirm(true)
      return
    }
    await commit(worktreePath, message, amend)
    setMessage('')
    setAmend(false)
    setShowAmendConfirm(false)
    onCommitted()
  }, [canCommit, amend, showAmendConfirm, commit, worktreePath, message, onCommitted])

  const handleCommitAndPush = useCallback(async () => {
    if (!canCommit) return
    if (amend && !showAmendConfirm) {
      setShowAmendConfirm(true)
      return
    }
    const result = await commit(worktreePath, message, amend)
    setMessage('')
    setAmend(false)
    setShowAmendConfirm(false)
    onCommitted()
    if (!result) return
    setPushing(true)
    try {
      const setUpstream = !currentBranch?.upstream
      await push({ worktreePath, setUpstream })
    } finally {
      setPushing(false)
      onCommitted()
    }
  }, [canCommit, amend, showAmendConfirm, commit, worktreePath, message, onCommitted, currentBranch, push])

  const handleGenerateMessage = useCallback(async () => {
    const generated = await generateCommitMessage(worktreePath)
    if (generated) {
      setMessage(generated.trim())
    }
  }, [generateCommitMessage, worktreePath])

  const handleCancel = useCallback(() => {
    setShowAmendConfirm(false)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    compositionEndTimeRef.current = Date.now()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return
      if (e.nativeEvent.isComposing || Date.now() - compositionEndTimeRef.current < 300) return
      handleCommit()
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
        onCompositionEnd={handleCompositionEnd}
        disabled={busy || generating}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="amend" checked={amend} onCheckedChange={setAmend} disabled={busy} />
          <Label htmlFor="amend" className="text-xs">
            Amend
          </Label>
        </div>
        {showAmendConfirm ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-destructive">直前のコミットを修正しますか？</span>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleCommit} disabled={busy}>
              確認
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancel}>
              キャンセル
            </Button>
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleGenerateMessage}
                    disabled={!hasStagedFiles || generating || busy}
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
              <Button size="sm" className="h-7" onClick={handleCommit} disabled={!canCommit}>
                {loading ? 'コミット中...' : 'コミット'}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 gap-1"
                    onClick={handleCommitAndPush}
                    disabled={!canCommit}
                    aria-label="コミット & プッシュ"
                  >
                    {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    <span>{pushing ? 'プッシュ中...' : loading ? 'コミット中...' : 'コミット & プッシュ'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>コミット後、リモートへプッシュします</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
      {!hasStagedFiles && !amend && <p className="text-xs text-muted-foreground">ステージ済みのファイルがありません</p>}
      {generateError && <p className="text-xs text-destructive">{generateError}</p>}
    </div>
  )
}
