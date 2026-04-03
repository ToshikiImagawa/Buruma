import type { WorktreeInfo } from '@domain'
import { cn } from '@lib/utils'
import { Circle, GitBranch } from 'lucide-react'

interface WorktreeListItemProps {
  worktree: WorktreeInfo
  selected: boolean
  onSelect: (path: string) => void
}

export function WorktreeListItem({ worktree, selected, onSelect }: WorktreeListItemProps) {
  const displayName = worktree.path.split('/').pop() ?? worktree.path

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-accent text-accent-foreground',
      )}
      onClick={() => onSelect(worktree.path)}
    >
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
  )
}
