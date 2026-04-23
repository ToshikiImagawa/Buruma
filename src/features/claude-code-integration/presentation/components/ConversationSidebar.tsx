import { useCallback, useState } from 'react'
import type { ConversationSummary } from '@domain'
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ConversationSidebarProps {
  conversations: ConversationSummary[]
  currentConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onNew,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">会話履歴</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNew}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>新しい会話</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">会話履歴がありません</div>
        ) : (
          <div className="flex flex-col py-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: ConversationSummary
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (confirmDelete) {
        onDelete(conversation.id)
        setConfirmDelete(false)
      } else {
        setConfirmDelete(true)
      }
    },
    [confirmDelete, conversation.id, onDelete],
  )

  const handleBlur = useCallback(() => {
    setConfirmDelete(false)
  }, [])

  return (
    <button
      type="button"
      className={`group/conv flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/50 ${
        isActive ? 'bg-accent' : ''
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{conversation.title}</div>
        {conversation.lastMessagePreview && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{conversation.lastMessagePreview}</div>
        )}
        <div className="mt-0.5 text-[10px] text-muted-foreground/60">{conversation.messageCount} メッセージ</div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover/conv:opacity-100 ${
              confirmDelete ? 'text-destructive opacity-100' : 'text-muted-foreground'
            }`}
            onClick={handleDelete}
            onBlur={handleBlur}
            aria-label={confirmDelete ? '削除を確認' : '会話を削除'}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{confirmDelete ? 'もう一度クリックで削除' : '削除'}</TooltipContent>
      </Tooltip>
    </button>
  )
}
