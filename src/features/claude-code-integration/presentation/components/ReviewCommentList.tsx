import type { ReviewComment } from '@domain'
import { cn } from '@lib/utils'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface ReviewCommentListProps {
  comments: ReviewComment[]
  summary?: string
  onCommentClick?: (comment: ReviewComment) => void
}

const severityConfig = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
} as const

export function ReviewCommentList({ comments, summary, onCommentClick }: ReviewCommentListProps) {
  if (comments.length === 0 && !summary) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {summary && (
        <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/50 p-3 text-sm">{summary}</div>
      )}
      {comments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {comments.map((comment) => {
            const config = severityConfig[comment.severity]
            const Icon = config.icon
            return (
              <button
                key={comment.id}
                type="button"
                className={cn(
                  'flex items-start gap-2 rounded-md border p-2.5 text-left text-sm transition-colors',
                  config.bg,
                  config.border,
                  onCommentClick && 'cursor-pointer hover:brightness-95',
                )}
                onClick={() => onCommentClick?.(comment)}
                disabled={!onCommentClick}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.color)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate font-mono">{comment.filePath}</span>
                    <span>
                      L{comment.lineStart}
                      {comment.lineEnd !== comment.lineStart && `-${comment.lineEnd}`}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap">{comment.message}</p>
                  {comment.suggestion && (
                    <pre className="mt-1.5 overflow-x-auto rounded bg-background/80 p-1.5 font-mono text-xs">
                      {comment.suggestion}
                    </pre>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
