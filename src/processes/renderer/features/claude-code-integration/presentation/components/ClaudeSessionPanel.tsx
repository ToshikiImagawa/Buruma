import { useEffect } from 'react'
import { Button } from '@renderer/components/ui/button'
import { FileSearch, GitBranch, GitCommit } from 'lucide-react'
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

  const isRunning = status === 'running'

  // コマンド完了時にステータスをリフレッシュ
  useEffect(() => {
    if (!onCommandCompleted) return
    const unsub = window.electronAPI.claude.onCommandCompleted((data) => {
      if (data.worktreePath === worktreePath) {
        onCommandCompleted()
      }
    })
    return unsub
  }, [worktreePath, onCommandCompleted])

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
