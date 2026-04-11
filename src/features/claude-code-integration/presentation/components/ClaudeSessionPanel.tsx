import { useEffect } from 'react'
import { listenEventSync } from '@lib/invoke/events'
import { FileSearch, GitBranch, GitCommit, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClaudeAuth } from '../use-claude-auth'
import { useClaudeSessionViewModel } from '../use-claude-session-viewmodel'
import { ClaudeOutputView } from './ClaudeOutputView'
import { CommandInput } from './CommandInput'
import { SessionStatusIndicator } from './SessionStatusIndicator'

interface ClaudeSessionPanelProps {
  worktreePath: string
  onCommandCompleted?: () => void
}

const QUICK_ACTIONS = [
  {
    label: '変更をコミット',
    icon: GitCommit,
    prompt: 'このワークツリーの変更内容を確認し、適切なコミットメッセージでコミットしてください',
  },
  {
    label: '差分をレビュー',
    icon: FileSearch,
    prompt: 'このワークツリーの現在の差分をレビューし、改善点を指摘してください',
  },
  {
    label: 'ブランチ状況',
    icon: GitBranch,
    prompt: '現在のブランチの状況（コミット履歴、リモートとの差分）を説明してください',
  },
]

export function ClaudeSessionPanel({ worktreePath, onCommandCompleted }: ClaudeSessionPanelProps) {
  const { status, outputs, isSessionActive, startSession, stopSession, sendCommand } = useClaudeSessionViewModel()
  const { authStatus, isAuthChecking, isLoggingIn, login } = useClaudeAuth()

  const isRunning = status === 'running'

  // コマンド完了時にステータスをリフレッシュ
  useEffect(() => {
    if (!onCommandCompleted) return
    return listenEventSync<{ worktreePath: string }>('claude-command-completed', (data) => {
      if (data.worktreePath === worktreePath) {
        onCommandCompleted()
      }
    })
  }, [worktreePath, onCommandCompleted])

  // 認証チェック中
  if (isAuthChecking && authStatus === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 未認証
  if (authStatus?.authenticated === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-muted-foreground">Claude Code にログインしていません</p>
        <Button onClick={login} disabled={isLoggingIn} className="gap-2">
          {isLoggingIn ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              ログイン
            </>
          )}
        </Button>
        {isLoggingIn && <p className="text-xs text-muted-foreground">ブラウザで認証を完了してください</p>}
        <div className="mt-2 max-w-sm rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium">ログインできない場合:</p>
          <p className="mt-1">ターミナルで以下のコマンドを実行してからアプリを再起動してください</p>
          <code className="mt-1 block rounded bg-background px-2 py-1 font-mono text-foreground">
            claude auth login
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <SessionStatusIndicator status={status} />
        <Button
          size="sm"
          variant={isSessionActive ? 'destructive' : 'default'}
          className="h-7 text-xs"
          onClick={() => (isSessionActive ? stopSession(worktreePath) : startSession(worktreePath))}
        >
          {isSessionActive ? 'セッション停止' : 'セッション開始'}
        </Button>
      </div>

      {/* クイックアクション */}
      {isRunning && (
        <div className="flex flex-wrap gap-1 border-b px-3 py-1.5">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-6 gap-1 text-xs"
              onClick={() => sendCommand(worktreePath, action.prompt)}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ClaudeOutputView outputs={outputs} />
      </div>
      <div className="border-t p-2">
        <CommandInput onSubmit={(input) => sendCommand(worktreePath, input)} disabled={!isRunning} />
      </div>
    </div>
  )
}
