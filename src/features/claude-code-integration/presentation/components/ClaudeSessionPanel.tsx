import { useCallback, useEffect, useState } from 'react'
import { listenEventSync } from '@lib/invoke/events'
import {
  FileSearch,
  GitBranch,
  GitCommit,
  Loader2,
  LogIn,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
} from 'lucide-react'
import { usePanelRef } from 'react-resizable-panels'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useClaudeAuth } from '../use-claude-auth'
import { useClaudeSessionViewModel } from '../use-claude-session-viewmodel'
import { ChatMessageList } from './ChatMessageList'
import { ClaudeOutputView } from './ClaudeOutputView'
import { CommandInput } from './CommandInput'
import { ConversationSidebar } from './ConversationSidebar'
import { ModelSelector } from './ModelSelector'
import { SessionStatusIndicator } from './SessionStatusIndicator'

interface ClaudeSessionPanelProps {
  worktreePath: string
  onCommandCompleted?: () => void
}

type ViewMode = 'chat' | 'terminal'

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
  const {
    status,
    outputs,
    chatMessages,
    isSessionActive,
    isCommandRunning,
    conversations,
    currentConversationId,
    selectedModel,
    startSession,
    resumeSession,
    stopSession,
    sendCommand,
    switchConversation,
    deleteConversation,
    startNewConversation,
    setSelectedModel,
  } = useClaudeSessionViewModel()
  const { authStatus, isAuthChecking, isLoggingIn, login } = useClaudeAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const sidebarRef = usePanelRef()

  const toggleSidebar = useCallback(() => {
    const panel = sidebarRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [sidebarRef])

  const isRunning = status === 'running'

  useEffect(() => {
    if (!onCommandCompleted) return
    return listenEventSync<{ worktreePath: string }>('claude-command-completed', (data) => {
      if (data.worktreePath === worktreePath) {
        onCommandCompleted()
      }
    })
  }, [worktreePath, onCommandCompleted])

  if (isAuthChecking && authStatus === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
    <TooltipProvider delayDuration={300}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          panelRef={sidebarRef}
          defaultSize="25%"
          minSize="15%"
          maxSize="60%"
          collapsible
          collapsedSize="0%"
          onResize={(size) => setSidebarOpen(size.asPercentage > 0)}
        >
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelect={switchConversation}
            onDelete={deleteConversation}
            onNew={startNewConversation}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75%">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSidebar}>
                      {sidebarOpen ? (
                        <PanelLeftClose className="h-3.5 w-3.5" />
                      ) : (
                        <PanelLeftOpen className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{sidebarOpen ? '履歴を隠す' : '履歴を表示'}</TooltipContent>
                </Tooltip>
                <SessionStatusIndicator status={status} />
              </div>
              <div className="flex items-center gap-1">
                <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={isCommandRunning} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${viewMode === 'chat' ? 'bg-accent' : ''}`}
                      onClick={() => setViewMode('chat')}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>チャット表示</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${viewMode === 'terminal' ? 'bg-accent' : ''}`}
                      onClick={() => setViewMode('terminal')}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>ターミナル表示</TooltipContent>
                </Tooltip>
                <Button
                  size="sm"
                  variant={isSessionActive ? 'destructive' : 'default'}
                  className="ml-2 h-7 text-xs"
                  onClick={() => {
                    if (isSessionActive && currentConversationId) {
                      stopSession(currentConversationId)
                    } else if (currentConversationId) {
                      resumeSession(currentConversationId)
                    } else {
                      startSession(worktreePath)
                    }
                  }}
                >
                  {isSessionActive ? 'セッション停止' : 'セッション開始'}
                </Button>
              </div>
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
                    disabled={isCommandRunning}
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {viewMode === 'chat' ? (
                <ChatMessageList messages={chatMessages} isCommandRunning={isCommandRunning} />
              ) : (
                <ClaudeOutputView outputs={outputs} />
              )}
            </div>
            <CommandInput
              onSubmit={(input) => sendCommand(worktreePath, input)}
              onCancel={() => currentConversationId && stopSession(currentConversationId)}
              disabled={!isRunning}
              isCommandRunning={isCommandRunning}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
