import type { SessionStatus } from '@domain'
import { cn } from '@lib/utils'

const statusConfig: Record<SessionStatus, { color: string; label: string; pulse?: boolean }> = {
  idle: { color: 'bg-muted-foreground', label: '停止中' },
  starting: { color: 'bg-yellow-500', label: '起動中...', pulse: true },
  running: { color: 'bg-green-500', label: '接続中' },
  stopping: { color: 'bg-yellow-500', label: '停止中...' },
  error: { color: 'bg-red-500', label: 'エラー' },
}

export function SessionStatusIndicator({ status }: { status: SessionStatus }) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', config.color, config.pulse && 'animate-pulse')} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  )
}
