import { Button } from '@renderer/components/ui/button'
import { useClaudeSessionViewModel } from '../use-claude-session-viewmodel'
import { ClaudeOutputView } from './ClaudeOutputView'
import { CommandInput } from './CommandInput'
import { SessionStatusIndicator } from './SessionStatusIndicator'

interface ClaudeSessionPanelProps {
  worktreePath: string
}

export function ClaudeSessionPanel({ worktreePath }: ClaudeSessionPanelProps) {
  const { status, outputs, isSessionActive, startSession, stopSession, sendCommand } = useClaudeSessionViewModel()

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
      <div className="flex-1 overflow-auto">
        <ClaudeOutputView outputs={outputs} autoScroll={true} />
      </div>
      <div className="border-t p-2">
        <CommandInput onSubmit={(input) => sendCommand(worktreePath, input)} disabled={status !== 'running'} />
      </div>
    </div>
  )
}
