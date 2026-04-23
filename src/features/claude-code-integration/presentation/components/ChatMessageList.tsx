import { memo, useCallback, useDeferredValue, useEffect, useRef } from 'react'
import type { ChatMessage } from '@domain'
import { Bot, User } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { MarkdownContent } from '@/components/markdown-content'

interface ChatMessageListProps {
  messages: ChatMessage[]
  isCommandRunning: boolean
}

export function ChatMessageList({ messages, isCommandRunning }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)
  const deferredMessages = useDeferredValue(messages)

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [deferredMessages])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }, [])

  if (deferredMessages.length === 0 && !isCommandRunning) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">セッションを開始して Claude Code と対話を始めてください</p>
        </div>
      </div>
    )
  }

  // 最後のメッセージが assistant かつコマンド実行中なら、ストリーミング中
  const lastMessage = deferredMessages[deferredMessages.length - 1]
  const isStreamingLastMessage = isCommandRunning && lastMessage?.role === 'assistant'
  // ユーザーメッセージの後でまだ assistant 応答がない場合のローディング表示
  const showWaitingIndicator = isCommandRunning && lastMessage?.role === 'user'

  return (
    <div ref={scrollRef} className="h-full overflow-auto p-4" onScroll={handleScroll}>
      <div className="mx-auto max-w-3xl space-y-4">
        {deferredMessages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreamingLastMessage && i === deferredMessages.length - 1}
          />
        ))}
        {showWaitingIndicator && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="max-w-[80%] rounded-lg bg-muted p-3 text-sm">
              <span className="inline-block h-4 w-1 animate-pulse bg-foreground/50" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`group/msg flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg p-3 text-sm ${
          isUser ? 'bg-primary text-primary-foreground whitespace-pre-wrap' : 'bg-muted'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <>
            <MarkdownContent content={message.content} />
            {isStreaming && <span className="inline-block h-4 w-1 animate-pulse bg-foreground/50" />}
          </>
        )}
      </div>
      {!isStreaming && <CopyButton text={message.content} />}
    </div>
  )
})
