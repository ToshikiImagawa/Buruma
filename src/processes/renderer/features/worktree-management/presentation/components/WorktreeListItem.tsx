import type { WorktreeInfo } from '@domain'
import { cn } from '@lib/utils'
import { Button } from '@renderer/components/ui/button'
import { Circle, GitBranch, Trash2 } from 'lucide-react'

interface WorktreeListItemProps {
  worktree: WorktreeInfo
  selected: boolean
  onSelect: (path: string) => void
  onDelete?: (worktree: WorktreeInfo) => void
}

export function WorktreeListItem({ worktree, selected, onSelect, onDelete }: WorktreeListItemProps) {
  const displayName = worktree.path.split('/').pop() ?? worktree.path

  return (
    <div
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-accent text-accent-foreground',
      )}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3" onClick={() => onSelect(worktree.path)}>
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{worktree.branch ?? worktree.head}</span>
            {worktree.isMain && (
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">main</span>
            )}
            {worktree.isDirty && <Circle className="h-2 w-2 shrink-0 fill-orange-500 text-orange-500" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{displayName}</p>
        </div>
      </button>
      {onDelete && !worktree.isMain && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(worktree)
          }}
          aria-label="ワークツリーを削除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
