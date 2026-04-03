import { useEffect, useState } from 'react'
import type { BranchInfo, GitProgressEvent } from '@domain'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { useRemoteOpsViewModel } from '../use-remote-ops-viewmodel'

interface PushPullButtonsProps {
  worktreePath: string
  currentBranch?: BranchInfo
  onRefresh: () => void
}

export function PushPullButtons({ worktreePath, currentBranch, onRefresh }: PushPullButtonsProps) {
  const { loading, lastError, push, pull, fetch } = useRemoteOpsViewModel()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customRemote, setCustomRemote] = useState('')
  const [customBranch, setCustomBranch] = useState('')
  const [progress, setProgress] = useState<GitProgressEvent | null>(null)

  useEffect(() => {
    const unsubscribe = window.electronAPI.git.onProgress((event) => {
      setProgress(event)
    })
    return unsubscribe
  }, [])

  // loading が false になったら進捗をクリア
  useEffect(() => {
    if (!loading) setProgress(null)
  }, [loading])

  const targetRemote = customRemote || undefined
  const targetBranch = customBranch || undefined

  const handlePush = () => {
    if (!currentBranch?.upstream && !customRemote) {
      push(worktreePath, targetRemote, targetBranch, true)
    } else {
      push(worktreePath, targetRemote, targetBranch)
    }
    onRefresh()
  }

  const handlePull = () => {
    pull(worktreePath, targetRemote, targetBranch)
    onRefresh()
  }

  const handleFetch = () => {
    fetch(worktreePath, targetRemote)
    onRefresh()
  }

  const ahead = currentBranch?.ahead ?? 0
  const behind = currentBranch?.behind ?? 0
  const upstreamRemote = currentBranch?.upstream?.split('/')[0]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={handlePush} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ArrowUp className="mr-1 h-3 w-3" />}
          Push
          {ahead > 0 && <span className="ml-1 text-muted-foreground">({ahead})</span>}
        </Button>
        <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={handlePull} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ArrowDown className="mr-1 h-3 w-3" />}
          Pull
          {behind > 0 && <span className="ml-1 text-muted-foreground">({behind})</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleFetch}
          disabled={loading}
          title="Fetch"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {/* リモート・ブランチ選択（展開式） */}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        リモート設定
      </button>
      {showAdvanced && (
        <div className="flex items-center gap-1">
          <Input
            className="h-6 flex-1 text-xs"
            placeholder={upstreamRemote ?? 'origin'}
            value={customRemote}
            onChange={(e) => setCustomRemote(e.target.value)}
            disabled={loading}
          />
          <span className="text-xs text-muted-foreground">/</span>
          <Input
            className="h-6 flex-1 text-xs"
            placeholder={currentBranch?.name ?? 'branch'}
            value={customBranch}
            onChange={(e) => setCustomBranch(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {loading && progress && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress.operation}: {progress.phase}
            </span>
            {progress.progress != null && <span>{progress.progress}%</span>}
          </div>
          {progress.progress != null && (
            <div className="h-1 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress.progress}%` }} />
            </div>
          )}
        </div>
      )}
      {!currentBranch?.upstream && !customRemote && (
        <p className="text-xs text-muted-foreground">upstream 未設定 — Push 時に自動設定されます</p>
      )}
      {lastError && (
        <p className="text-xs text-destructive">
          {lastError.code === 'NO_UPSTREAM'
            ? 'upstream が設定されていません'
            : lastError.code === 'PUSH_REJECTED'
              ? 'Push が拒否されました。先に Pull してください'
              : lastError.code === 'PULL_CONFLICT'
                ? 'コンフリクトが発生しました'
                : lastError.message}
        </p>
      )}
    </div>
  )
}
