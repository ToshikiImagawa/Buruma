import type { BranchInfo } from '@domain'
import { Button } from '@renderer/components/ui/button'
import { ArrowDown, ArrowUp, Loader2, RefreshCw } from 'lucide-react'
import { useRemoteOpsViewModel } from '../use-remote-ops-viewmodel'

interface PushPullButtonsProps {
  worktreePath: string
  currentBranch?: BranchInfo
  onRefresh: () => void
}

export function PushPullButtons({ worktreePath, currentBranch, onRefresh }: PushPullButtonsProps) {
  const { loading, lastError, push, pull, fetch } = useRemoteOpsViewModel()

  const handlePush = () => {
    if (!currentBranch?.upstream) {
      push(worktreePath, undefined, undefined, true)
    } else {
      push(worktreePath)
    }
    onRefresh()
  }

  const handlePull = () => {
    pull(worktreePath)
    onRefresh()
  }

  const handleFetch = () => {
    fetch(worktreePath)
    onRefresh()
  }

  const ahead = currentBranch?.ahead ?? 0
  const behind = currentBranch?.behind ?? 0

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
      {!currentBranch?.upstream && (
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
